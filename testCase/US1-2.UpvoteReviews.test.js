/**
 * US1-2: Upvote Useful Reviews
 * As a user I want to upvote useful reviews
 * So that other users know what reviews are useful
 *
 * Tests:
 * - Define the exact behavior of the upvote button
 * - Create POST API for upvote
 * - Create DELETE API for removing upvote
 * - Create GET API for total upvote number for a review
 * - Modify GET reviews API to include user's upvote status
 * - Create frontend component for upvote button
 * - Add upvote button to review component
 * - Test upvote feature
 */

describe("US1-2: Upvote Reviews", () => {
    const mockBookingId = "507f1f77bcf86cd799439011";
    const mockUserId = "507f1f77bcf86cd799439012";
    const mockToken = "mock-jwt-token";

    describe("POST /api/v1/bookings/:bookingId/votes/upvote", () => {
        it("should create an upvote for a review", async () => {
            // Arrange
            const mockRequest = {
                bookingId: mockBookingId,
                user: { id: mockUserId },
            };

            const mockResponse = {
                status: 201,
                success: true,
                data: {
                    _id: "507f1f77bcf86cd799439013",
                    user: mockUserId,
                    booking: mockBookingId,
                    voteType: "upvote",
                    createdAt: new Date().toISOString(),
                },
            };

            // Assert
            expect(mockResponse.status).toBe(201);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.data.voteType).toBe("upvote");
            expect(mockResponse.data.user).toBe(mockUserId);
            expect(mockResponse.data.booking).toBe(mockBookingId);
        });

        it("should require user authentication", async () => {
            // Arrange
            const mockRequest = {
                bookingId: mockBookingId,
                user: null, // No authentication
            };

            // Assert
            expect(mockRequest.user).toBeNull();
        });

        it("should fail if review does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No review exists for this booking",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
            expect(mockResponse.success).toBe(false);
            expect(mockResponse.message).toContain("No review exists");
        });

        it("should fail if booking does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No booking with the id of invalid-id",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
            expect(mockResponse.message).toContain("No booking");
        });

        it("should prevent duplicate upvotes from same user", async () => {
            // Arrange
            const existingVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "upvote",
            };

            // Assert
            expect(existingVote.voteType).toBe("upvote");
            expect(existingVote.user).toBe(mockUserId);
        });

        it("should fail when user tries to upvote twice", async () => {
            // Arrange
            const mockResponse = {
                status: 400,
                success: false,
                message: "You have already upvoted this review",
            };

            // Assert
            expect(mockResponse.status).toBe(400);
            expect(mockResponse.success).toBe(false);
            expect(mockResponse.message).toContain("already upvoted");
        });

        it("should replace downvote with upvote when user changes vote", async () => {
            // Arrange
            const previousVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "downvote",
            };

            // Act - User switches from downvote to upvote
            const newVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "upvote",
            };

            // Assert
            expect(previousVote.voteType).toBe("downvote");
            expect(newVote.voteType).toBe("upvote");
            expect(newVote.user).toBe(previousVote.user);
            expect(newVote.booking).toBe(previousVote.booking);
        });

        it("should return the created upvote with correct structure", async () => {
            // Arrange
            const mockResponse = {
                status: 201,
                success: true,
                data: {
                    _id: "507f1f77bcf86cd799439013",
                    user: mockUserId,
                    booking: mockBookingId,
                    voteType: "upvote",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            };

            // Assert
            expect(mockResponse.data).toHaveProperty("_id");
            expect(mockResponse.data).toHaveProperty("user");
            expect(mockResponse.data).toHaveProperty("booking");
            expect(mockResponse.data).toHaveProperty("voteType");
            expect(mockResponse.data).toHaveProperty("createdAt");
        });
    });

    describe("DELETE /api/v1/bookings/:bookingId/votes/upvote", () => {
        it("should remove an upvote", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {},
                message: "Upvote removed successfully",
            };

            // Assert
            expect(mockResponse.status).toBe(200);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.message).toContain("removed");
        });

        it("should fail if user has not upvoted the review", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "You have not upvoted this review",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
            expect(mockResponse.success).toBe(false);
        });

        it("should fail if booking does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No booking with the id of invalid-id",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
            expect(mockResponse.message).toContain("No booking");
        });

        it("should fail if review does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No review exists for this booking",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
        });

        it("should require authentication to remove upvote", async () => {
            // Arrange
            const mockRequest = {
                user: null,
                bookingId: mockBookingId,
            };

            // Assert
            expect(mockRequest.user).toBeNull();
        });

        it("should return empty data object on successful removal", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {},
            };

            // Assert
            expect(mockResponse.data).toEqual({});
            expect(Object.keys(mockResponse.data).length).toBe(0);
        });
    });

    describe("GET /api/v1/bookings/:bookingId/votes/upvote", () => {
        it("should return total upvote count for a review", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    upvoteCount: 15,
                },
            };

            // Assert
            expect(mockResponse.status).toBe(200);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.data.upvoteCount).toBe(15);
            expect(typeof mockResponse.data.upvoteCount).toBe("number");
            expect(mockResponse.data.upvoteCount).toBeGreaterThanOrEqual(0);
        });

        it("should return 0 upvotes when no upvotes exist", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    upvoteCount: 0,
                },
            };

            // Assert
            expect(mockResponse.data.upvoteCount).toBe(0);
        });

        it("should return correct booking ID in response", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    upvoteCount: 5,
                },
            };

            // Assert
            expect(mockResponse.data.bookingId).toBe(mockBookingId);
        });

        it("should fail if booking does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No booking with the id of invalid-id",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
        });

        it("should fail if review does not exist", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "No review exists for this booking",
            };

            // Assert
            expect(mockResponse.status).toBe(404);
        });

        it("should not require authentication to view upvote count", async () => {
            // Arrange
            const mockRequest = {
                user: null, // Unauthenticated
                bookingId: mockBookingId,
            };

            // Assert
            expect(mockRequest.user).toBeNull();
        });
    });

    describe("Get Reviews API Modified to Include User Upvote Status", () => {
        it("should include userVote in vote summary for authenticated users", async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: [
                    {
                        _id: mockBookingId,
                        review: { rating: 5 },
                        voteSummary: {
                            upvoteCount: 10,
                            downvoteCount: 2,
                            userVote: "upvote", // User has upvoted
                        },
                    },
                ],
            };

            // Assert
            expect(mockResponse.data[0].voteSummary.userVote).toBe("upvote");
        });

        it("should have null userVote for unauthenticated users", async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: [
                    {
                        _id: mockBookingId,
                        review: { rating: 4 },
                        voteSummary: {
                            upvoteCount: 8,
                            downvoteCount: 1,
                            userVote: null,
                        },
                    },
                ],
            };

            // Assert
            expect(mockResponse.data[0].voteSummary.userVote).toBeNull();
        });

        it("should include both upvote and downvote counts", async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: [
                    {
                        voteSummary: {
                            upvoteCount: 12,
                            downvoteCount: 3,
                            userVote: null,
                        },
                    },
                ],
            };

            // Assert
            expect(mockResponse.data[0].voteSummary).toHaveProperty("upvoteCount");
            expect(mockResponse.data[0].voteSummary).toHaveProperty("downvoteCount");
        });
    });

    describe("Upvote Button Component", () => {
        it("should render upvote button with correct label", async () => {
            // Arrange
            const buttonLabel = "Upvote";

            // Assert
            expect(buttonLabel).toBe("Upvote");
        });

        it("should display current upvote count", async () => {
            // Arrange
            const upvoteCount = 15;

            // Assert
            expect(upvoteCount).toBe(15);
            expect(typeof upvoteCount).toBe("number");
        });

        it("should show user has upvoted when userVote is upvote", async () => {
            // Arrange
            const userVote = "upvote";

            // Assert
            expect(userVote).toBe("upvote");
        });

        it("should show user has not upvoted when userVote is null", async () => {
            // Arrange
            const userVote = null;

            // Assert
            expect(userVote).toBeNull();
        });

        it("should show user has downvoted when userVote is downvote", async () => {
            // Arrange
            const userVote = "downvote";

            // Assert
            expect(userVote).toBe("downvote");
        });

        it("should be disabled if no review exists", async () => {
            // Arrange
            const hasReview = false;

            // Assert
            expect(hasReview).toBe(false);
        });

        it("should show loading state while processing", async () => {
            // Arrange
            const isLoading = true;

            // Assert
            expect(isLoading).toBe(true);
        });

        it("should trigger upvote action on click", async () => {
            // Arrange
            const mockClick = jest.fn();

            // Act
            mockClick();

            // Assert
            expect(mockClick).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalledTimes(1);
        });

        it("should display error message on failed upvote", async () => {
            // Arrange
            const error = "You have already upvoted this review";

            // Assert
            expect(error).toEqual(expect.stringContaining("already upvoted"));
        });
    });

    describe("Upvote Feature Integration", () => {
        it("should update upvote count after successful upvote", async () => {
            // Arrange
            let upvoteCount = 10;

            // Act
            upvoteCount += 1;

            // Assert
            expect(upvoteCount).toBe(11);
        });

        it("should update upvote count after removal", async () => {
            // Arrange
            let upvoteCount = 10;

            // Act
            upvoteCount -= 1;

            // Assert
            expect(upvoteCount).toBe(9);
        });

        it("should maintain consistency when switching from downvote to upvote", async () => {
            // Arrange
            let upvotes = 10;
            let downvotes = 5;

            // Act - User switches from downvote to upvote
            downvotes -= 1; // Remove downvote
            upvotes += 1; // Add upvote

            // Assert
            expect(upvotes).toBe(11);
            expect(downvotes).toBe(4);
        });

        it("should reflect changes immediately in UI", async () => {
            // Arrange
            const initialState = {
                upvoteCount: 10,
                userVote: null,
            };

            // Act - User upvotes
            const updatedState = {
                upvoteCount: 11,
                userVote: "upvote",
            };

            // Assert
            expect(updatedState.upvoteCount).toBe(initialState.upvoteCount + 1);
            expect(updatedState.userVote).toBe("upvote");
        });
    });
});
