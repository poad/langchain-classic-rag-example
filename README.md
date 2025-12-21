# langchain-classic-rag-example

Simple RAG by LangChain.js classic API.

## Environment Variables

| Name | Require | Description | default value |
| ---- | ------- | ----------- | ------------- |
| LLM_MODEL | N | Model ID of LLM in [src/constants.ts](./src/constants.ts) | nova-micro |
| EMBEDDINGS | N | Model ID of Embeddings Models | amazon.titan-embed-text-v2:0 |
| AZURE_OPENAI_API_INSTANCE_NAME | Conditional (Requirements for using LLMs or embeddings from Microsoft Foundry) | Instance Name of Microsoft Faundary | \- |
| AZURE_OPENAI_API_KEY | Conditional (Requirements for using LLMs or embeddings from Microsoft Foundry) | API Key of Microsoft Faundary | \- |
| AZURE_OPENAI_API_VERSION | Conditional (Requirements for using LLMs or embeddings from Microsoft Foundry) | API Version of Microsoft Faundary | \- |

| AWS_ACCESS_KEY_ID | Conditional (Requirements for using LLMs or embeddings from Amazon Bedrock) | Access Key ID for Amazon Web Service | \- |
| AWS_SECRET_ACCESS_KEY | Conditional (Requirements for using LLMs or embeddings from Amazon Bedrock) | Secret Access Key for Amazon Web Service | \- |
| AWS_SESSION_TOKEN | Conditional (Requirements for using LLMs or embeddings from Amazon Bedrock) | Session Token for Amazon Web Service | \- |
| AWS_REGION | Conditional (Requirements for using LLMs or embeddings from Amazon Bedrock) | Region code for Amazon Web Service | \- |

\* `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, and `AWS_REGION` are the same as those used by the AWS CLI, so they can be configured using methods other than environment variables.
