'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocPage() {
  const [spec, setSpec] = useState<object | null>(null);

  useEffect(() => {
    fetch('/api-doc/json')
      .then((res) => res.json())
      .then(setSpec)
      .catch(() => setSpec(null));
  }, []);

  if (!spec) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <p>Cargando especificación OpenAPI...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
