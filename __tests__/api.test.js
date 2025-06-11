process.env.NEXT_PUBLIC_BACKEND_URL = 'http://example.com'
const { apiService } = require('../lib/api')

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ predicted_label: 'ok', confidence: 1, evaluation: 'correct', observation: '' }),
  }),
) 

describe('apiService.predict', () => {
  it('calls backend using environment URL', async () => {
    await apiService.predict({ sequence: [], expected_label: 'test', nickname: 'nick' })
    expect(fetch).toHaveBeenCalledWith('http://example.com/predict', expect.any(Object))
  })
})
