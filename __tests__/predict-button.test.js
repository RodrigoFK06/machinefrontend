const React = require('react')
const { render, fireEvent, waitFor } = require('@testing-library/react')

jest.mock('../lib/api', () => ({
  apiService: { predict: jest.fn() },
}))
const { apiService } = require('../lib/api')

function PredictButton() {
  const [result, setResult] = React.useState(null)
  const handleClick = async () => {
    try {
      const res = await apiService.predict({ sequence: [], expected_label: 'test', nickname: 'demo' })
      setResult(res.predicted_label)
    } catch (e) {
      setResult('error')
    }
  }
  return React.createElement('div', null,
    React.createElement('button', { onClick: handleClick }, 'Predict'),
    result ? React.createElement('span', { 'data-testid': 'result' }, result) : null
  )
}

describe('Predict button', () => {
  it('shows result on success', async () => {
    apiService.predict.mockResolvedValue({ predicted_label: 'ok' })
    const { getByText, findByTestId } = render(React.createElement(PredictButton))
    fireEvent.click(getByText('Predict'))
    const span = await findByTestId('result')
    expect(span.textContent).toBe('ok')
  })

  it('handles error', async () => {
    apiService.predict.mockRejectedValue(new Error('fail'))
    const { getByText, findByTestId } = render(React.createElement(PredictButton))
    fireEvent.click(getByText('Predict'))
    const span = await findByTestId('result')
    expect(span.textContent).toBe('error')
  })
})
