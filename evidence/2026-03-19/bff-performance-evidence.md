# BFF Performance Evidence (#85)

## Objective
Prove BFF aggregation achieves p95 < 400ms.

## Method
- Tool: ApacheBench (ab)
- Endpoints: 
  - `GET /api/v1/customer/dashboard`
  - `GET /api/v1/customer/account-overview`
- Load: 1000 requests, concurrency 20
- Authentication: Bearer token with CUSTOMER role
- Warm-up: 50 requests before main test

## Results

### Dashboard Endpoint
```
Requests per second:    2165.87 [#/sec] (mean)
Time per request:       9.234 [ms] (mean)
  50%      8ms
  95%     18ms  <-- Target: < 400ms ✅
 100%     34ms (max)
```

### Account Overview Endpoint
```
Requests per second:    2939.19 [#/sec] (mean)
Time per request:       6.805 [ms] (mean)
  50%      6ms
  95%     12ms  <-- Target: < 400ms ✅
 100%     25ms (max)
```

## Conclusion
Both endpoints are well below the 400ms p95 threshold.
