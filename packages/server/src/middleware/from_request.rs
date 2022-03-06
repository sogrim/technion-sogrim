#[macro_export]
macro_rules! impl_from_request {
    (resource=$resource:ty, getter=$get_fn:ident) => {
        impl FromRequest for $resource {
            type Error = Error;
            type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

            fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
                let req = req.clone();
                Box::pin(async move {
                    let client = match req.app_data::<Data<mongodb::Client>>() {
                        Some(client) => client,
                        None => {
                            log::error!("Mongodb client not found in application data");
                            return Err(ErrorInternalServerError(
                                "Mongodb client not found in application data",
                            ));
                        }
                    };
                    match req.extensions().get::<Sub>() {
                        Some(key) => db::services::$get_fn(key, client).await,
                        None => {
                            log::error!("Middleware Error: Sub not found in request extensions");
                            Err(ErrorInternalServerError(
                                "Middleware Error: Sub not found in request extensions",
                            ))
                        }
                    }
                })
            }

            fn extract(req: &HttpRequest) -> Self::Future {
                Self::from_request(req, &mut Payload::None)
            }
        }
    };
}
