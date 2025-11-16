import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import ModalProvider from './components/ModalProvider'
import ToastProvider from './components/ToastProvider'
import I18nProvider from './i18n/I18nProvider'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ToastProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
