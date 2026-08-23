import React, { useEffect, useState } from 'react';
import './ArcPdfEmbed.css';

interface ArcPdfEmbedProps {
  url: string;
  name?: string;
  height?: string;
  showMaximizeButton?: boolean;
}

const ArcPdfEmbed: React.FC<ArcPdfEmbedProps> = ({ url }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [iframeSrc, setIframeSrc] = useState<string>('');

  const PDF_VIEWER = "https://mozilla.github.io/pdf.js/web/viewer.html?file=" + encodeURIComponent(url);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const initArcPDF = async () => {
      try {
        /*
            INTERNET CHECK
        */
        if (!navigator.onLine) {
          if (isMounted) setStatus('error');
          return;
        }

        // The fetch HEAD request was removed because it was causing cache/ServiceWorker 
        // deadlocks unless DevTools was open (with 'Disable cache').
        // We now rely purely on PDF.js to load the document natively.
        
        if (isMounted) {
          /*
              SET SRC IN STATE
          */
          setIframeSrc(PDF_VIEWER);

          /*
              FAILSAFE TIMEOUT
          */
          timer = setTimeout(() => {
            setStatus(prev => {
              if (prev !== 'success') {
                console.log("[ArcPDF] Timeout.");
                return 'error';
              }
              return prev;
            });
          }, 8000);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) setStatus('error');
      }
    };

    /*
        OFFLINE DETECTION
    */
    const handleOffline = () => {
      if (isMounted) setStatus('error');
    };

    window.addEventListener("offline", handleOffline);
    
    /*
        START SYSTEM
    */
    initArcPDF();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("offline", handleOffline);
    };
  }, [url, PDF_VIEWER]);

  const handleIframeLoad = () => {
    console.log("[ArcPDF] PDF carregado.");
    setStatus('success');
    
    // Workaround: PDF.js sometimes fails to calculate its internal layout
    // when injected dynamically via React. Dispatching a resize event
    // forces it to repaint the canvas without needing to open DevTools.
    // Multiple dispatches ensure it catches the exact moment PDF.js is ready.
    [200, 500, 1000, 2000].forEach(delay => {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay);
    });
  };

  return (
    <div align="center">
      <div className="arcpdf-wrapper">
        {iframeSrc && (
          <iframe
            src={iframeSrc}
            onLoad={handleIframeLoad}
            className="pdf-frame"
            sandbox="allow-scripts allow-same-origin allow-downloads"
          />
        )}

        {status === 'loading' && (
          <div className="pdf-loading">
            <div className="spinner"></div>
            <div className="loading-text">
              <span className="loading-glitch">Inicializando ArcPDF...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="pdf-error">
            <img
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ff0055' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'></path><line x1='12' y1='9' x2='12' y2='13'></line><line x1='12' y1='17' x2='12.01' y2='17'></line></svg>"
              alt="Erro"
              className="error-icon"
            />
            <h1 className="glitch" data-text="FALHA NO MÓDULO ARCPDF">FALHA NO MÓDULO ARCPDF</h1>
            <div className="error-code">(CÓDIGO 0x7E)</div>
            <p className="error-description">
              Não foi possível carregar o documento PDF.
              <br /><br />
              Possíveis causas detectadas:
              <br /><br />
              • O servidor bloqueou iframes<br />
              • O PDF foi removido<br />
              • O documento está corrompido<br />
              • Falha de conexão<br />
              • Timeout de carregamento<br />
              • Conteúdo inválido<br />
              • Política CSP/X-Frame-Options
            </p>
            <a
              className="pdf-button"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              📄 ABRIR.PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArcPdfEmbed;
