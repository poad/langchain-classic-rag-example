if (process.env.ENABLED_OPENINFERENCE_TELEMETRY === 'true') {
  const { registerInstrumentations } = await import('@opentelemetry/instrumentation');
  const { context, propagation, trace } = await import('@opentelemetry/api');
  const { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator }  = await import('@opentelemetry/core');
  const { AsyncLocalStorageContextManager }  = await import('@opentelemetry/context-async-hooks');

  const {
    TracerProvider,
    SimpleSpanProcessor,
  } = await import('@opentelemetry/sdk-trace');
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

  const provider = new TracerProvider({
    spanProcessors: [new SimpleSpanProcessor({exporter:
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:6006/v1/traces',
        headers: {
          'x-api-key': process.env.OTEL_EXPORTER_OTLP_API_KEY ?? '',
          'Langsmith-Project': 'default',
        },
      }),
    },
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

  trace.setGlobalTracerProvider(provider);
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  }));

  logger.info('👀 OpenInference initialized');
}
