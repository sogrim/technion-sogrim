use actix_web::{
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    http::header,
    web::Data,
    Error, HttpMessage, HttpResponse,
};
use actix_web_lab::middleware::Next;

use super::jwt_decoder::JwtDecoder;

// use `pub` to re-export the `Sub` type from the `jwt_decoder` module
pub use super::jwt_decoder::Sub;

pub async fn authenticate(
    req: ServiceRequest,
    next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    let (request, payload) = req.into_parts();
    let Some(header) = request.headers().get(header::AUTHORIZATION) else {
        let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
        resp.response_mut().extensions_mut().insert::<String>(String::from("No authorization header"));
        return Ok(resp);
    };

    let Ok(jwt) = header.to_str() else {
        let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
        resp.response_mut().extensions_mut().insert::<String>(String::from("Invalid authorization header"));
        return Ok(resp);
    };

    let Some(decoder) = request.app_data::<Data<JwtDecoder>>() else {
        let mut resp = ServiceResponse::new(request, HttpResponse::InternalServerError().finish());
        resp.response_mut().extensions_mut().insert::<String>(String::from("JwtDecoder not initialized"));
        return Ok(resp);
    };

    let sub = match decoder.decode(jwt).await {
        Ok(sub) => sub,
        Err(err) => {
            let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
            resp.response_mut()
                .extensions_mut()
                .insert::<String>(err.to_string());
            return Ok(resp);
        }
    };

    request.extensions_mut().insert::<Sub>(sub);
    let res = next
        .call(ServiceRequest::from_parts(request, payload))
        .await?;
    Ok(res.map_into_boxed_body())
}
