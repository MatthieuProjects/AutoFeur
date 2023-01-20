use anyhow::anyhow;
use autofeur::save::Save;
use hyper::http::{Request, Response};
use hyper::{server::Server, Body};
use std::collections::HashMap;
use std::{fs, net::SocketAddr, sync::Arc};
use tower::{make::Shared, ServiceBuilder};
use tower_http::add_extension::AddExtensionLayer;

fn parse_query(query: &str) -> HashMap<String, String> {
    query
        .split('&')
        .filter_map(|s| {
            s.split_once('=')
                .and_then(|t| Some((t.0.to_owned(), t.1.to_owned())))
        })
        .collect()
}

async fn handler(request: Request<Body>) -> Result<Response<Body>, anyhow::Error> {
    let save: &Arc<Save> = request.extensions().get().unwrap();
    let query = request
        .uri()
        .query()
        .ok_or_else(|| anyhow!("query does not exists"))?;
    let data = parse_query(query)
        .get("grapheme")
        .ok_or_else(|| anyhow!("grapheme argument is not specified"))?
        .clone();

    let infered = save
        .inference(&data)
        .await
        .or_else(|_| Err(anyhow!("cannot find data")))?;

    Ok(Response::builder().body(Body::from(infered)).unwrap())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let checkpoint: Save = bincode::deserialize(&fs::read("assets/db.bin").unwrap()).unwrap();
    let service = ServiceBuilder::new()
        .layer(AddExtensionLayer::new(Arc::new(checkpoint)))
        // Wrap a `Service` in our middleware stack
        .service_fn(handler);

    // And run our service using `hyper`
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    Server::bind(&addr)
        .http1_only(true)
        .serve(Shared::new(service))
        .await
        .expect("server error");
    Ok(())
}
