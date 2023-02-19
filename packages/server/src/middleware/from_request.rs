#[macro_export]
macro_rules! impl_from_request {
    (for $resource:ty) => {
        impl actix_web::FromRequest for $resource {
            type Error = $crate::error::AppError;
            type Future =
                std::pin::Pin<Box<dyn std::future::Future<Output = Result<Self, Self::Error>>>>;

            fn from_request(
                req: &actix_web::HttpRequest,
                _: &mut actix_web::dev::Payload,
            ) -> Self::Future {
                let req = req.clone();
                Box::pin(async move {
                    let db = match req.app_data::<actix_web::web::Data<$crate::db::Db>>() {
                        Some(db) => db,
                        None => {
                            return Err($crate::error::AppError::InternalServer(
                                "Mongodb client not found in application data".into(),
                            ))
                        }
                    };
                    use actix_web::HttpMessage; // Required for `req.extensions()`
                    let optional_sub = req.extensions().get::<$crate::auth::Sub>().cloned();
                    let user = match optional_sub {
                        Some(key) => db.get::<$resource>(&key).await,
                        None => Err($crate::error::AppError::Middleware(
                            "Sub not found in request extensions".into(),
                        )),
                    }?;
                    let is_authorized = match (req.path(), user.permissions) {
                        (path, permissions) if path.starts_with("/student") => {
                            permissions >= Permissions::Student
                        }
                        (path, permissions) if path.starts_with("/admin") => {
                            permissions >= Permissions::Admin
                        }
                        (path, permissions) if path.starts_with("/owner") => {
                            permissions >= Permissions::Owner
                        }
                        _ => false,
                    };
                    if !is_authorized {
                        return Err($crate::error::AppError::Unauthorized(
                            "User not authorized to access this resource".into(),
                        ));
                    }
                    Ok(user)
                })
            }

            fn extract(req: &actix_web::HttpRequest) -> Self::Future {
                Self::from_request(req, &mut actix_web::dev::Payload::None)
            }
        }
    };
}
