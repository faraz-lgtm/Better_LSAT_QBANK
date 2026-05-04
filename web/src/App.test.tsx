import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import App from './App'
import { store } from '@/app/store'

describe('App', () => {
  it('redirects root to login route', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    )
    expect(await screen.findByRole('heading', { name: /login with/i })).toBeInTheDocument()
  })
})
