# E02: Core Infrastructure

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Dependencies** | E01 |
| **Tasks** | 6 |
| **Estimated Effort** | 12-20 hours |

## Goal
Build the shared foundation all tools depend on: HTTP client with Reddit conventions, rate limiter, error handling, and the Reddit type system. Success means any tool can make authenticated, rate-limited Reddit API calls with proper error handling by depending on this infrastructure layer.

## Context
Implements API conventions (raw_json=1, api_type=json, User-Agent format), token bucket rate limiting (100 QPM with 10-minute rolling window), parsing of all 4 Reddit error response formats, and TypeScript types for the Thing system (t1-t6). These are the building blocks every tool in the server depends on.

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 2, 4, 7, 11
- research/01-reddit-official-api.md
- research/07-api-edge-cases-and-gotchas.md

## Task Index

| ID | Title | Size | Status | Dependencies |
|----|-------|:----:|--------|-------------|
| [T01](E02-T01-reddit-http-client.md) | Reddit HTTP Client Foundation | M | Not Started | E01-T03 |
| [T02](E02-T02-token-bucket-rate-limiter.md) | Token Bucket Rate Limiter | M | Not Started | E01-T05 |
| [T03](E02-T03-reddit-error-parser.md) | Reddit Error Parser (4 Formats) | M | Not Started | T01 |
| [T04](E02-T04-reddit-thing-types.md) | Reddit Thing Types and Response Types | M | Not Started | T01 |
| [T05](E02-T05-response-normalization.md) | Response Normalization Utilities | S | Not Started | T04 |
| [T06](E02-T06-integrate-rate-limiter.md) | Integrate Rate Limiter into HTTP Client | S | Not Started | T01, T02, T03 |

## Success Criteria
- HTTP client automatically appends `raw_json=1` to GETs and `api_type=json` to POSTs
- Rate limiter blocks when tokens exhausted and respects `X-Ratelimit-*` headers
- All 4 Reddit error formats parsed into unified `RedditApiError`
- TypeScript types cover all Thing types with documented quirks (`replies: "" | Listing`, `edited: boolean | number`)
- Integration test proves full request flow: acquire token -> send request -> parse errors -> update rate limit state
