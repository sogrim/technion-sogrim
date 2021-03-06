#[macro_export]
macro_rules! impl_from_request {
    (resource=$resource:ty, getter=$get_fn:ident) => {
        impl FromRequest for $resource {
            type Error = AppError;
            type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

            fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
                let req = req.clone();
                Box::pin(async move {
                    let client = match req.app_data::<Data<mongodb::Client>>() {
                        Some(client) => client,
                        None => {
                            return Err(AppError::InternalServer(
                                "Mongodb client not found in application data".into(),
                            ))
                        }
                    };
                    match req.extensions().get::<Sub>() {
                        Some(key) => db::services::$get_fn(key, client).await,
                        None => Err(AppError::Middleware(
                            "Sub not found in request extensions".into(),
                        )),
                    }
                })
            }

            fn extract(req: &HttpRequest) -> Self::Future {
                Self::from_request(req, &mut Payload::None)
            }
        }
    };
}
