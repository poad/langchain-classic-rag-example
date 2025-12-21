export const models = [
  {
    id: 'nova-micro',
    name: 'Amazon Nove Micro (Amazon Bedrock)',
    modelId: 'us.amazon.nova-micro-v1:0',
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'nova-lite',
    name: 'Amazon Nove Lite (Amazon Bedrock)',
    modelId: 'us.amazon.nova-lite-v1:0',
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'nova-pro',
    name: 'Amazon Nove Pro (Amazon Bedrock)',
    modelId: 'us.amazon.nova-pro-v1:0',
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'nova-premier',
    name: 'Amazon Nove Premier (Amazon Bedrock)',
    modelId: 'us.amazon.nova-premier-v1:0',
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'nova2-lite',
    name: 'Amazon Nove 2 Lite (Amazon Bedrock)',
    modelId: 'global.amazon.nova-2-lite-v1:0',
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'gpt-oss-20b',
    name: 'OpenAI gpt-oss-20b (Amazon Bedrock)',
    modelId: 'openai.gpt-oss-20b-1:0',
    disabled: true,
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'gpt-oss-120b',
    name: 'OpenAI gpt-oss-120b (Amazon Bedrock)',
    modelId: 'openai.gpt-oss-120b-1:0',
    disabled: true,
    platform: 'aws',
    temperatureSupport: true,
  },
  {
    id: 'gpt-5-mini',
    name: 'gpt-5-mini',
    modelId: 'gpt-5-mini',
    platform: 'azure',
    temperatureSupport: false,
  },
  {
    id: 'gpt-5-nano',
    name: 'gpt-5-nano',
    modelId: 'gpt-5-nano',
    platform: 'azure',
    temperatureSupport: false,
  },
  {
    id: 'gpt-5.1-chat',
    name: 'gpt-5.1-chat',
    modelId: 'gpt-5.1-chat',
    platform: 'azure',
    temperatureSupport: false,
  },
  {
    id: 'gpt-5.2-chat',
    name: 'gpt-5.2-chat',
    modelId: 'gpt-5.2-chat',
    platform: 'azure',
    temperatureSupport: false,
  },
];

export const embeddings = [
  {
    id: 'amazon.titan-embed-text-v2:0',
    name: 'Amazon Titan Text Embeddings V2 (Amazon Bedrock)',
    modelId: 'amazon.titan-embed-text-v2:0',
    platform: 'aws',

  },
    {
    id: 'text-embedding-3-large',
    name: 'text-embedding-3-large (Azure OpenAI)',
    modelId: 'text-embedding-3-large',
    platform: 'azure',
  }
];
