// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo'
import { BrowserRouter } from 'react-router-dom'
import { PlayerProvider } from './player/PlayerContext'
import AppShell from './AppShell'
import './styles/index.css'
import './styles/trackRow.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PlayerProvider>
          <AppShell />
        </PlayerProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
)
