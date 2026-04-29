use http::header;
use tower_http::cors::{AllowOrigin, CorsLayer};

pub fn cors(debug: bool) -> CorsLayer {
    let methods = vec![
        http::Method::GET,
        http::Method::POST,
        http::Method::PUT,
        http::Method::DELETE,
    ];
    let headers = vec![header::AUTHORIZATION, header::CONTENT_TYPE];

    let origin = if debug {
        AllowOrigin::predicate(|origin, _| origin.as_bytes().starts_with(b"http://localhost"))
    } else {
        AllowOrigin::list([
            "https://sogrim.org".parse().unwrap(),
            "https://www.sogrim.org".parse().unwrap(),
            "https://students.sogrim.org".parse().unwrap(),
            "https://sogrim.onrender.com".parse().unwrap(),
            "https://sogrim-v2.onrender.com".parse().unwrap(),
        ])
    };

    CorsLayer::new()
        .allow_methods(methods)
        .allow_headers(headers)
        .allow_origin(origin)
}

#[cfg(test)]
#[path = "cors_tests.rs"]
mod cors_tests;
