extern crate jsonwebtoken_google;

use actix_web::{Error, HttpMessage, dev::ServiceRequest, error::ErrorNotAcceptable};
use actix_web_httpauth::{extractors::bearer::BearerAuth};
use jsonwebtoken_google::{Parser, ParserError};
use serde::Deserialize;

#[derive(Default, Debug, Deserialize)]
pub struct IdInfo<EF=bool, TM=u64> {
    /// These six fields are included in all Google ID Tokens.
    pub iss: String,
    pub sub: String,
    pub azp: String,
    pub aud: String,
    pub iat: TM,
    pub exp: TM,

    /// This value indicates the user belongs to a Google Hosted Domain
    pub hd: Option<String>,

    /// These seven fields are only included when the user has granted the "profile" and
    /// "email" OAuth scopes to the application.
    pub email: Option<String>,
    pub email_verified: Option<EF>,  // eg. "true" (but unusually as a string)
    pub name: Option<String>,
    pub picture: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub locale: Option<String>,
}

//pub struct UserIdentifier<Subject=&'static str>(pub Subject);

pub async fn get_decoded(token: &str) -> Result<IdInfo, ParserError> {
    if std::env::var("PROFILE").unwrap_or("debug".into()) == "debug" {
        return Ok(IdInfo{
            sub: "bugo-the-debugo".into(),
            ..Default::default()
        })
    }
    let parser = Parser::new("646752534395-ptsuv4l9b4vojdad2ruussj6mo22fc86.apps.googleusercontent.com");
    Ok(parser.parse::<IdInfo>(token).await?)
}

pub async fn validator(req: ServiceRequest, credentials: BearerAuth) -> Result<ServiceRequest, Error>{
    let id_info : IdInfo = get_decoded(credentials.token())
    .await
    .map_err(|err|ErrorNotAcceptable(err.to_string()))?;
    
    req.extensions_mut().insert(id_info.sub);
    Ok(req)
}

#[cfg(test)]
pub(crate) mod tests{
    use actix_web::{App, http::StatusCode, middleware::Logger, test::{self, TestRequest}};
    use actix_web_httpauth::middleware::HttpAuthentication;
    use mongodb::Client;

    use crate::{auth, user};


    pub const PLAYGROUND_TOKEN : &'static str = r#"eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3YzcyNjE5ZDA5MzVhMjkwYzQxYzNmMDEwMTY3MTM4Njg1ZjdlNTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2MzY3MzA1OTksImF1ZCI6IjY0Njc1MjUzNDM5NS1wdHN1djRsOWI0dm9qZGFkMnJ1dXNzajZtbzIyZmM4Ni5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMjkwNTQ1NDU1ODQ4MzM3MDAwNiIsImVtYWlsIjoibmlzc2FuLm9oYW5hQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhenAiOiI2NDY3NTI1MzQzOTUtcHRzdXY0bDliNHZvamRhZDJydXVzc2o2bW8yMmZjODYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJuYW1lIjoiTmlzc2FuIE9oYW5hIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdnODJPQVdDVVdoYXVEb0RKa1NuYzdEVDQ4WW1sR1puYl9QeFltTEZnPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6Ik5pc3NhbiIsImZhbWlseV9uYW1lIjoiT2hhbmEiLCJpYXQiOjE2MzY3MzA4OTksImV4cCI6MTYzNjczNDQ5OSwianRpIjoiY2ZlMzc1YmNmYTE4YjUxZmNiODE2MmQ3MjliMDk0ZjQ3Zjc5OTQ0NiJ9.iHhk2mWh-pXhH-bSKl1C93BksW6LzaNFhBW_aYXFEUW0myYUibuWZEaXRluZBuJRp4SMIoXG3Y68MTxBFqMAy-rZ5L8stW4S1-FVK6C0BGB0YLf5z_ALlRu4K0LJqd-VA7ha8V2B2rAUgjWFDYSMcGkzJOH4T8mXuZn2Zfred_tV4YYa1UydFteEtPTrkAQ9MZzw4h5fh3op_SC5wJKqMar3vp4m2Oidvi2Omi4RuyHHDhi8Yqx3HetrTnYyL8rPrLNul2s70u2xWLYVveUdLjzE377bgH1BpvjxVYe6GYQFOEnVlUni5wsmSCWDtxdmSfTkVnQCDX5i1m9qkfwYwQ"#;
    
    #[actix_rt::test]
    async fn decode(){
        let token = super::get_decoded(PLAYGROUND_TOKEN).await;
        println!("{:#?}", token.unwrap())
    }
    
    #[actix_rt::test]
    async fn test_authorized(){
    
        std::env::set_var("RUST_LOG", "actix_web=debug,actix_server=info");
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
        let client = Client::with_uri_str("mongodb+srv://nbl_admin:sm3sw0rFjzMcQeW3@sogrimdev.7tmyn.mongodb.net/Development?retryWrites=true&w=majority").await.expect("failed to connect");
    
        let app = test::init_service(
        App::new()
                .wrap(HttpAuthentication::bearer(auth::validator))
                .wrap(Logger::default())
                .app_data(actix_web::web::Data::new(client.clone()))
                .service(user::debug)
        ).await;
    
        // Create request object
        let req = TestRequest::get()
            .uri("/user/hello")
            .insert_header(("Authorization", format!("Bearer {}", PLAYGROUND_TOKEN)))
            .to_request();
    
        // Call application
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);   
    }
}

