# E07-T02: Resources -- User Profile and Post Details

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **Epic**         | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status**       | Done                                        |
| **Size**         | S                                           |
| **Dependencies** | E04-T05, E04-T02                            |

## Description

Implement `reddit://user/{username}/about` and `reddit://post/{id}`. Expose user profiles and post details as MCP resources.

## Acceptance Criteria

1. User resource returns profile summary (karma, age, etc.)
2. Post resource returns full post details
3. Both reuse existing read tool logic internally
4. URI templates correctly parameterized

## Definition of Ready

- [ ] E04-T05 (get_user tool) is Done and its API call logic is reusable
- [ ] E04-T02 (get_post tool) is Done and its API call logic is reusable
- [ ] MCP SDK resource registration pattern understood (`server.resource()` with URI templates)
- [ ] FINAL section 12.1 read: URI schemes `reddit://user/{username}/about` and `reddit://post/{id}`
- [ ] Post ID handling understood: accept bare ID or fullname, strip `t3_` prefix if present

## Definition of Done

- [ ] `reddit://user/{username}/about` resource registered and returns profile summary (karma, account age, etc.)
- [ ] `reddit://post/{id}` resource registered and returns full post details as structured JSON
- [ ] Both resources reuse existing read tool logic from E04-T05 and E04-T02 internally
- [ ] URI templates correctly parameterized with `{username}` and `{id}` placeholders
- [ ] Post resource handles both bare ID and `t3_`-prefixed fullname
- [ ] MCP Inspector shows both resources and they return valid JSON
- [ ] Unit tests cover: valid user, nonexistent user, valid post, invalid post ID formats
- [ ] Resources exported from `src/resources/index.ts` barrel file
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope

User's post history as a resource.

## Implementation Notes

- Post ID in URI should accept bare ID or fullname (strip `t3_` prefix if present)
- Reuse the same API call logic from E04-T05 (get_user) and E04-T02 (get_post)
- Return structured JSON matching what the read tools return

## Files to Create/Modify

- `src/resources/user.ts` -- user resource implementation
- `src/resources/post.ts` -- post resource implementation
