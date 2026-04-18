# Sprint 1 Test Suite: Reviews & Voting System

This folder contains comprehensive test cases for **Sprint 1 (EPIC-1)**: Reviews on rental information.

## Overview

The test suite covers all 4 user stories:
- **US1-1**: View Reviews for a Car Provider
- **US1-2**: Upvote Useful Reviews
- **US1-3**: Downvote Unhelpful Reviews
- **US1-4**: Sort Reviews by Helpful or Recent

## Test Structure

```
testCase/
├── setup.js                    # Test environment configuration
├── utils.js                    # Helper functions and mock data generators
├── US1-1.ViewReviews.test.js   # View reviews functionality tests
├── US1-2.UpvoteReviews.test.js # Upvote feature tests
├── US1-3.DownvoteReviews.test.js # Downvote feature tests
├── US1-4.SortReviews.test.js   # Sorting functionality tests
└── README.md                   # This file
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- US1-1.ViewReviews.test.js
```

## Test Cases Summary

### US1-1: View Reviews for Car Provider
**Total: 10 test suites covering**
- ✓ GET /api/v1/car-providers/:id/reviews endpoint
- ✓ Retrieve reviews with vote summary
- ✓ Handle empty reviews (no reviews found message)
- ✓ Display review components correctly
- ✓ Include user voting information
- ✓ Filter invalid reviews
- ✓ Display rating validation (1-5)
- ✓ UI requirements for provider reviews page

**Expected Behavior:**
```javascript
{
  success: true,
  data: [
    {
      _id: "booking_id",
      user: { _id, name, email },
      review: { rating, comment, createdAt, updatedAt },
      voteSummary: {
        upvoteCount: Number,
        downvoteCount: Number,
        userVote: null | "upvote" | "downvote"
      }
    }
  ]
}
```

### US1-2: Upvote Reviews
**Total: 6 test suites covering**
- ✓ POST /api/v1/bookings/:bookingId/votes/upvote
- ✓ DELETE /api/v1/bookings/:bookingId/votes/upvote
- ✓ GET /api/v1/bookings/:bookingId/votes/upvote (count)
- ✓ Upvote button component behavior
- ✓ Prevent duplicate upvotes
- ✓ Replace downvote with upvote functionality
- ✓ Integration with review display

**Key Features:**
- Requires authentication
- One vote per user per review
- Can switch from downvote to upvote
- Immediate UI updates
- Vote count persistence

### US1-3: Downvote Reviews
**Total: 6 test suites covering**
- ✓ POST /api/v1/bookings/:bookingId/votes/downvote
- ✓ DELETE /api/v1/bookings/:bookingId/votes/downvote
- ✓ GET /api/v1/bookings/:bookingId/votes/downvote (count)
- ✓ Downvote button component behavior
- ✓ Prevent duplicate downvotes
- ✓ Replace upvote with downvote functionality
- ✓ Vote summary consistency

**Key Features:**
- Requires authentication
- One vote per user per review
- Can switch from upvote to downvote
- Immediate UI updates
- Consistent vote tracking

### US1-4: Sort Reviews
**Total: 7 test suites covering**
- ✓ Sort by most recent (newest first)
- ✓ Sort by most helpful (highest net votes)
- ✓ Sort controls UI component
- ✓ Default and alternative sort options
- ✓ Sort stability with equal values
- ✓ Performance with large review sets
- ✓ Sort with filtering

**Sort Algorithms:**
```javascript
// Most Recent (default)
sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

// Most Helpful
sort((a, b) =>
  (b.upvoteCount - b.downvoteCount) -
  (a.upvoteCount - a.downvoteCount)
)
```

## API Endpoints Tested

### Reviews
- `GET /api/v1/car-providers/:id/reviews` - Get all reviews for a provider
- `POST /api/v1/bookings/:bookingId/reviews` - Add review (Additional Requirements)
- `PUT /api/v1/bookings/:bookingId/reviews` - Update review (Additional Requirements)
- `DELETE /api/v1/bookings/:bookingId/reviews` - Delete review (Additional Requirements)

### Votes
- `GET /api/v1/bookings/:bookingId/votes` - Get vote summary
- `POST /api/v1/bookings/:bookingId/votes/upvote` - Add upvote
- `DELETE /api/v1/bookings/:bookingId/votes/upvote` - Remove upvote
- `GET /api/v1/bookings/:bookingId/votes/upvote` - Get upvote count
- `POST /api/v1/bookings/:bookingId/votes/downvote` - Add downvote
- `DELETE /api/v1/bookings/:bookingId/votes/downvote` - Remove downvote
- `GET /api/v1/bookings/:bookingId/votes/downvote` - Get downvote count

## Test Utilities

### Mock Data Generators (utils.js)
```javascript
// Generate test data
createMockToken(userId, role)
createMockUser(overrides)
createMockCarProvider(overrides)
createMockBooking(overrides)
createMockReview(overrides)
createMockVote(overrides)
```

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "status": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "status": 400 | 401 | 404 | 500
}
```

## Authentication

Tests assume JWT-based authentication with token passed in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Database Models

### Review Schema
- `rating` (Number, 1-5, required)
- `comment` (String, required, trimmed)
- `timestamps` (createdAt, updatedAt)

### Vote Schema
- `user` (ObjectId, ref: User, required)
- `booking` (ObjectId, ref: Booking, required)
- `voteType` (enum: ['upvote', 'downvote'], required)
- `timestamps` (createdAt, updatedAt)

## Common Error Scenarios

| Error | Status | When | Solution |
|-------|--------|------|----------|
| No booking found | 404 | Invalid booking ID | Verify booking ID exists |
| No review exists | 404 | Review not created | Create review first |
| Already voted | 400 | User voted twice | Remove vote before new vote |
| Not authorized | 401 | No authentication | Login and get JWT token |
| Already upvoted | 400 | Duplicate upvote | Can only have one vote per review |
| Not upvoted | 404 | Try to remove non-existent upvote | User hasn't upvoted yet |

## Notes for Developers

1. **Mock vs Integration**: These tests use mocked data structures. They validate logic and behavior without needing a database.

2. **TDD Approach**: Tests are written with TDD in mind - they specify expected behavior before implementation.

3. **Comprehensive Coverage**: Tests cover happy paths, edge cases, and error scenarios.

4. **Frontend & Backend**: Tests cover both API endpoints and UI component requirements.

5. **Vote Logic**:
   - User can only have ONE vote per review (upvote OR downvote, not both)
   - Voting again with the opposite vote replaces the previous vote
   - Vote counts are aggregated per review

6. **Sorting Performance**: Tests include performance checks for large datasets (1000+ reviews)

## Converting Mock Tests to Integration Tests

To convert these test cases to actual integration tests with database:

1. Use MongoDB connection from `setup.js`
2. Create fixtures/seeders for test data
3. Use `supertest` for HTTP endpoint testing
4. Mock `protect` middleware for authentication
5. Run against test database

Example:
```javascript
const request = require('supertest');
const app = require('../server');

describe('GET /api/v1/car-providers/:id/reviews', () => {
  it('should retrieve reviews', async () => {
    const res = await request(app)
      .get(`/api/v1/car-providers/${providerId}/reviews`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

## Best Practices

✅ Do:
- Test behavior, not implementation
- Use descriptive test names
- One assertion per concept
- Mock external dependencies
- Test error cases

❌ Don't:
- Make actual API calls from tests
- Depend on database state
- Test third-party libraries
- Skip error scenario tests
- Leave TODO comments without fixes

## Support & Documentation

For more information:
- Review controllers: `controllers/reviews.js`, `controllers/votes.js`
- Vote logic: `models/Vote.js`
- API documentation: `api-docs` endpoint
- Sprint backlog: See project management tool

---

**Last Updated**: April 2024
**Test Suite Version**: 1.0
**Coverage**: US1-1 through US1-4
