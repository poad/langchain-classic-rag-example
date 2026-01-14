if (process.env.ENABLED_OPENINFERENCE_TELEMETRY === 'true') {
  const { registerInstrumentations } = await import('@opentelemetry/instrumentation');
  const {
    NodeTracerProvider,
    SimpleSpanProcessor,
  } = await import('@opentelemetry/sdk-trace-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');
  const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');
  const { diag, DiagConsoleLogger, DiagLogLevel } = await import('@opentelemetry/api');
  const { LangChainInstrumentation } = await import('@arizeai/openinference-instrumentation-langchain');
  const lcCallbackManager = await import('@langchain/core/callbacks/manager');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');
  const { createLogger } = await import('./logger.js');

  const logger = await createLogger();

  // For troubleshooting, set the log level to DiagLogLevel.DEBUG
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:6006/v1/traces',
        headers: {
          'x-api-key': process.env.OTEL_EXPORTER_OTLP_API_KEY ?? '',
          'Langsmith-Project': 'default',
        },
      }),
    ),
    ],
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'chat-service',
    }),
  });

  registerInstrumentations({
    instrumentations: [],
  });

  // LangChain must be manually instrumented as it doesn't have a traditional module structure
  const lcInstrumentation = new LangChainInstrumentation();
  lcInstrumentation.manuallyInstrument(lcCallbackManager);

  provider.register();

  logger.info('👀 OpenInference initialized');
}
