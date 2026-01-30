INSERT INTO modules (
    id, name, description, category, version, 
    price, license_type, execution_mode, primitives, ui_schema, 
    author, tags, requires_hal, requires_gpu, 
    created_at, updated_at
) VALUES (
    'network-troubleshooter-bot',
    'Network Troubleshooting Bot',
    'AI chatbot that diagnoses network issues and suggests fixes using RAG.',
    'network',
    '1.0.0',
    54.0,
    'lease',
    'server',
    '[{"module": "ChatbotEngine", "method": "chat", "config": {"kb_id": "network_knowledge"}}, {"module": "DataIngestion", "method": "fetch_internal_api", "config": {"endpoint": "/api/v1/telemetry/live"}}]',
    '{"form_fields": [{"name": "query", "type": "text", "label": "What''s the issue?", "required": true}], "output_type": "chat"}',
    'AlienNet Ops',
    '["network", "chatbot", "ai", "troubleshooting"]',
    false,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    primitives = EXCLUDED.primitives,
    ui_schema = EXCLUDED.ui_schema;
