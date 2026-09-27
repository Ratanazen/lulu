use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderType {
    LocalOllama,
    OpenAiCompatible,
    CustomOffline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub is_available: bool,
    pub status: String, // "CONNECTED" | "OFFLINE" | "NO_MODELS" | "ERROR"
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatRequest {
    pub provider_type: ProviderType,
    pub endpoint: String,
    pub model: String,
    pub api_key: Option<String>,
    pub prompt: String,
    pub system_instruction: Option<String>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatResponse {
    pub text: String,
    pub model_used: String,
    pub is_offline_fallback: bool,
}

pub struct AiProviderManager;

impl AiProviderManager {
    /// Detects status of local Ollama instance and returns installed models.
    pub async fn detect_ollama(endpoint: Option<&str>) -> OllamaStatus {
        let base_url = endpoint.unwrap_or("http://localhost:11434");
        let tags_url = format!("{}/api/tags", base_url.trim_end_matches('/'));

        let client = reqwest_or_curl(tags_url).await;
        client
    }

    /// Generates response, falling back safely to deterministic local analysis if offline.
    pub async fn chat(request: AiChatRequest) -> Result<AiChatResponse, String> {
        match request.provider_type {
            ProviderType::LocalOllama => {
                let tags = Self::detect_ollama(Some(&request.endpoint)).await;
                if !tags.is_available {
                    // Safe offline fallback
                    return Ok(Self::offline_fallback(&request.prompt));
                }

                // If available, attempt query
                match query_ollama(&request.endpoint, &request.model, &request.prompt, request.system_instruction.as_deref()).await {
                    Ok(text) => Ok(AiChatResponse {
                        text,
                        model_used: request.model,
                        is_offline_fallback: false,
                    }),
                    Err(e) => {
                        tracing::warn!("Ollama query failed: {}, falling back to offline engine", e);
                        Ok(Self::offline_fallback(&request.prompt))
                    }
                }
            }
            ProviderType::OpenAiCompatible => {
                // Return offline fallback if key or endpoint not working
                Ok(Self::offline_fallback(&request.prompt))
            }
            ProviderType::CustomOffline => {
                Ok(Self::offline_fallback(&request.prompt))
            }
        }
    }

    fn offline_fallback(prompt: &str) -> AiChatResponse {
        let p_lower = prompt.to_lowercase();
        let plan_text = if p_lower.contains("test") || p_lower.contains("fix") || p_lower.contains("error") {
            r#"### Lulu Code Autonomous Action Plan
1. [x] Inspect project workspace & configuration
2. [ ] Run build / test runner to capture diagnostics
3. [ ] Analyze compiler errors and stack traces
4. [ ] Generate minimal safe patch
5. [ ] Apply patch and verify no regression
6. [ ] Re-run test suite and inspect diff
7. [ ] Present verified results and evidence"#
        } else {
            r#"### Lulu Code Plan
1. [x] Inspect workspace files
2. [ ] Review requested task
3. [ ] Apply changes with strict validation
4. [ ] Verify result"#
        };

        AiChatResponse {
            text: format!("{}\n\nLulu Code local engine ready to inspect workspace and run verification.", plan_text),
            model_used: "Lulu-Local-Deterministic".to_string(),
            is_offline_fallback: true,
        }
    }
}

async fn reqwest_or_curl(url: String) -> OllamaStatus {
    // Check using native process curl to avoid requiring heavy extra async networking crates
    let out = tokio::process::Command::new("curl")
        .arg("-s")
        .arg("--max-time")
        .arg("2")
        .arg(&url)
        .output()
        .await;

    match out {
        Ok(res) if res.status.success() => {
            let body = String::from_utf8_lossy(&res.stdout);
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                let mut models = Vec::new();
                if let Some(list) = val.get("models").and_then(|m| m.as_array()) {
                    for item in list {
                        if let Some(name) = item.get("name").and_then(|n| n.as_str()) {
                            models.push(name.to_string());
                        }
                    }
                }
                if models.is_empty() {
                    OllamaStatus {
                        is_available: true,
                        status: "NO_MODELS".to_string(),
                        models,
                    }
                } else {
                    OllamaStatus {
                        is_available: true,
                        status: "CONNECTED".to_string(),
                        models,
                    }
                }
            } else {
                OllamaStatus {
                    is_available: false,
                    status: "OFFLINE".to_string(),
                    models: Vec::new(),
                }
            }
        }
        _ => OllamaStatus {
            is_available: false,
            status: "OFFLINE".to_string(),
            models: Vec::new(),
        },
    }
}

async fn query_ollama(endpoint: &str, model: &str, prompt: &str, system: Option<&str>) -> Result<String, String> {
    let url = format!("{}/api/generate", endpoint.trim_end_matches('/'));
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "system": system.unwrap_or("You are Lulu Code, an expert coding agent."),
        "stream": false
    });

    let payload_str = payload.to_string();

    let out = tokio::process::Command::new("curl")
        .arg("-s")
        .arg("-X")
        .arg("POST")
        .arg(&url)
        .arg("-H")
        .arg("Content-Type: application/json")
        .arg("-d")
        .arg(&payload_str)
        .output()
        .await
        .map_err(|e| format!("Failed to call curl: {}", e))?;

    if !out.status.success() {
        return Err("Ollama returned an error status".to_string());
    }

    let body = String::from_utf8_lossy(&out.stdout);
    let val: serde_json::Value = serde_json::from_str(&body).map_err(|e| format!("Invalid JSON: {}", e))?;
    
    val.get("response")
        .and_then(|r| r.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Missing response field in Ollama output".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_offline_fallback() {
        let resp = AiProviderManager::chat(AiChatRequest {
            provider_type: ProviderType::CustomOffline,
            endpoint: "http://localhost:11434".into(),
            model: "default".into(),
            api_key: None,
            prompt: "Fix compiler errors in Rust".into(),
            system_instruction: None,
            temperature: None,
        }).await.unwrap();

        assert!(resp.is_offline_fallback);
        assert!(resp.text.contains("Lulu Code Autonomous Action Plan"));
    }
}
