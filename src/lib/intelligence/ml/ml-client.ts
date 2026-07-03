import { backendFetch } from '@/lib/backend-client'

export interface PredictRequest {
  learner_id: string
  features: number[]
}

export interface PredictResponse {
  mastery_probability: number
  forgetting_days: number
  attention_risk: 'low' | 'moderate' | 'high' | 'critical'
  dropout_probability: number
  confidence_lower: number
  confidence_upper: number
  models_loaded?: boolean
  prediction_latency_ms?: number
  source?: string
}

export async function predictMastery(request: PredictRequest): Promise<PredictResponse> {
  return backendFetch<PredictResponse>('/api/ml-proxy/predict', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
