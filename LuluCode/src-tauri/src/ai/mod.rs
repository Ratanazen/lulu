use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProviderType {
    #[serde(rename = "LOCAL_OLLAMA", alias = "LocalOllama")]
    LocalOllama,
    #[serde(rename = "OPENAI", alias = "OpenAi")]
    OpenAi,
    #[serde(rename = "GOOGLE_GEMINI", alias = "GoogleGemini")]
    GoogleGemini,
    #[serde(rename = "OPENAI_COMPATIBLE", alias = "OpenAiCompatible")]
    OpenAiCompatible,
    #[serde(rename = "CUSTOM", alias = "CustomOffline")]
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
        reqwest_or_curl(tags_url).await
    }

    /// Generates response, falling back safely to deterministic local analysis if offline.
    pub async fn chat(request: AiChatRequest) -> Result<AiChatResponse, String> {
        match request.provider_type {
            ProviderType::LocalOllama => {
                let tags = Self::detect_ollama(Some(&request.endpoint)).await;
                if !tags.is_available {
                    return Ok(Self::offline_fallback(&request.prompt));
                }

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
            ProviderType::OpenAi => {
                let key = match request.api_key.as_deref() {
                    Some(k) if !k.trim().is_empty() => k.trim(),
                    _ => return Ok(Self::offline_fallback(&request.prompt)),
                };
                let ep = if request.endpoint.trim().is_empty() {
                    "https://api.openai.com/v1"
                } else {
                    request.endpoint.trim()
                };

                match query_openai(ep, &request.model, &request.prompt, key, request.system_instruction.as_deref()).await {
                    Ok(text) => Ok(AiChatResponse {
                        text,
                        model_used: request.model,
                        is_offline_fallback: false,
                    }),
                    Err(e) => {
                        tracing::warn!("OpenAI query failed: {}, falling back to offline engine", e);
                        Ok(Self::offline_fallback(&request.prompt))
                    }
                }
            }
            ProviderType::GoogleGemini => {
                let key = match request.api_key.as_deref() {
                    Some(k) if !k.trim().is_empty() => k.trim(),
                    _ => return Ok(Self::offline_fallback(&request.prompt)),
                };
                let model = if request.model.trim().is_empty() {
                    "gemini-1.5-flash"
                } else {
                    request.model.trim()
                };

                match query_gemini(model, &request.prompt, key, request.system_instruction.as_deref()).await {
                    Ok(text) => Ok(AiChatResponse {
                        text,
                        model_used: model.to_string(),
                        is_offline_fallback: false,
                    }),
                    Err(e) => {
                        tracing::warn!("Gemini query failed: {}, falling back to offline engine", e);
                        Ok(Self::offline_fallback(&request.prompt))
                    }
                }
            }
            ProviderType::OpenAiCompatible => {
                let key = request.api_key.as_deref().filter(|k| !k.trim().is_empty());
                let ep = if request.endpoint.trim().is_empty() {
                    "http://localhost:8000/v1"
                } else {
                    request.endpoint.trim()
                };

                match query_openai(ep, &request.model, &request.prompt, key.unwrap_or(""), request.system_instruction.as_deref()).await {
                    Ok(text) => Ok(AiChatResponse {
                        text,
                        model_used: request.model,
                        is_offline_fallback: false,
                    }),
                    Err(e) => {
                        tracing::warn!("OpenAI-compatible query failed: {}, falling back to offline engine", e);
                        Ok(Self::offline_fallback(&request.prompt))
                    }
                }
            }
            ProviderType::CustomOffline => {
                Ok(Self::offline_fallback(&request.prompt))
            }
        }
    }

    /// Verifies provider connectivity with a fast ping request.
    pub async fn test_connection(request: AiChatRequest) -> Result<String, String> {
        let test_prompt = "Say hello in one word.";
        let mut req = request;
        req.prompt = test_prompt.to_string();

        match req.provider_type {
            ProviderType::LocalOllama => {
                let tags = Self::detect_ollama(Some(&req.endpoint)).await;
                if tags.is_available {
                    Ok(format!("Connected to Ollama at {} (Models: {})", req.endpoint, tags.models.join(", ")))
                } else {
                    Err(format!("Could not connect to Ollama at {}", req.endpoint))
                }
            }
            ProviderType::OpenAi => {
                let key = req.api_key.as_deref().unwrap_or("");
                if key.trim().is_empty() {
                    return Err("Missing OpenAI API Key".into());
                }
                let ep = if req.endpoint.trim().is_empty() { "https://api.openai.com/v1" } else { req.endpoint.trim() };
                query_openai(ep, &req.model, &req.prompt, key, None).await
            }
            ProviderType::GoogleGemini => {
                let key = req.api_key.as_deref().unwrap_or("");
                if key.trim().is_empty() {
                    return Err("Missing Google Gemini API Key".into());
                }
                let model = if req.model.trim().is_empty() { "gemini-1.5-flash" } else { req.model.trim() };
                query_gemini(model, &req.prompt, key, None).await
            }
            ProviderType::OpenAiCompatible => {
                let key = req.api_key.as_deref().unwrap_or("");
                let ep = if req.endpoint.trim().is_empty() { "http://localhost:8000/v1" } else { req.endpoint.trim() };
                query_openai(ep, &req.model, &req.prompt, key, None).await
            }
            ProviderType::CustomOffline => {
                Ok("Offline deterministic rule engine is ready.".into())
            }
        }
    }

    pub fn offline_fallback(prompt: &str) -> AiChatResponse {
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

async fn query_openai(endpoint: &str, model: &str, prompt: &str, api_key: &str, system: Option<&str>) -> Result<String, String> {
    let url = format!("{}/chat/completions", endpoint.trim_end_matches('/'));
    let mut messages = Vec::new();
    if let Some(sys) = system {
        messages.push(serde_json::json!({
            "role": "system",
            "content": sys
        }));
    }
    messages.push(serde_json::json!({
        "role": "user",
        "content": prompt
    }));

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "temperature": 0.2
    });

    let payload_str = payload.to_string();
    let auth_header = format!("Authorization: Bearer {}", api_key);

    let mut cmd = tokio::process::Command::new("curl");
    cmd.arg("-s")
       .arg("--max-time").arg("30")
       .arg("-X").arg("POST")
       .arg(&url)
       .arg("-H").arg("Content-Type: application/json")
       .arg("-d").arg(&payload_str);

    if !api_key.is_empty() {
        cmd.arg("-H").arg(&auth_header);
    }

    let out = cmd.output().await.map_err(|e| format!("Failed to execute curl: {}", e))?;
    if !out.status.success() {
        return Err("OpenAI request failed".into());
    }

    let body = String::from_utf8_lossy(&out.stdout);
    let val: serde_json::Value = serde_json::from_str(&body).map_err(|e| format!("Invalid JSON response: {}", e))?;

    if let Some(err_msg) = val.get("error").and_then(|e| e.get("message")).and_then(|m| m.as_str()) {
        return Err(format!("OpenAI Error: {}", err_msg));
    }

    val.get("choices")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No completion choices returned".to_string())
}

async fn query_gemini(model: &str, prompt: &str, api_key: &str, system: Option<&str>) -> Result<String, String> {
    let clean_model = if model.starts_with("models/") {
        model.to_string()
    } else {
        format!("models/{}", model)
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/{}:generateContent?key={}",
        clean_model, api_key
    );

    let mut payload = serde_json::json!({
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    });

    if let Some(sys) = system {
        payload["systemInstruction"] = serde_json::json!({
            "parts": [{"text": sys}]
        });
    }

    let payload_str = payload.to_string();

    let out = tokio::process::Command::new("curl")
        .arg("-s")
        .arg("--max-time").arg("30")
        .arg("-X").arg("POST")
        .arg(&url)
        .arg("-H").arg("Content-Type: application/json")
        .arg("-d").arg(&payload_str)
        .output()
        .await
        .map_err(|e| format!("Failed to call curl: {}", e))?;

    let body = String::from_utf8_lossy(&out.stdout);
    let val: serde_json::Value = serde_json::from_str(&body).map_err(|e| format!("Invalid JSON response: {}", e))?;

    if let Some(err_msg) = val.get("error").and_then(|e| e.get("message")).and_then(|m| m.as_str()) {
        return Err(format!("Gemini Error: {}", err_msg));
    }

    val.get("candidates")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|cand| cand.get("content"))
        .and_then(|cnt| cnt.get("parts"))
        .and_then(|p| p.as_array())
        .and_then(|arr| arr.first())
        .and_then(|part| part.get("text"))
        .and_then(|t| t.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No content parts in Gemini response".to_string())
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

    #[test]
    fn test_provider_deserialization() {
        let json_ollama = r#""LOCAL_OLLAMA""#;
        let p1: ProviderType = serde_json::from_str(json_ollama).unwrap();
        assert_eq!(p1, ProviderType::LocalOllama);

        let json_openai = r#""OPENAI""#;
        let p2: ProviderType = serde_json::from_str(json_openai).unwrap();
        assert_eq!(p2, ProviderType::OpenAi);

        let json_gemini = r#""GOOGLE_GEMINI""#;
        let p3: ProviderType = serde_json::from_str(json_gemini).unwrap();
        assert_eq!(p3, ProviderType::GoogleGemini);
    }
}
