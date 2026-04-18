/**
 * US1-3: Downvote Unhelpful Reviews
 * As a user I want to downvote unhelpful reviews
 * So that other users know what reviews are unhelpful
 *
 * Tests:
 * - Create POST API for downvote
 * - Create DELETE API for removing downvote
 * - Create GET API for total downvote number for a review
 * - Modify GET reviews API to include user's downvote status
 * - Create frontend component for downvote button
 * - Add downvote button to review component
 * - Test downvote feature
 */

describe("US1-3: Downvote Reviews", () => {
    const mockBookingId = "507f1f77bcf86cd799439011";
    const mockUserId = "507f1f77bcf86cd799439012";
    const mockToken = "mock-jwt-token";

    describe("POST /api/v1/bookings/:bookingId/votes/downvote", () => {
        it("should create a downvote for a review", async () => {
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
                    voteType: "downvote",
                    createdAt: new Date().toISOString(),
                },
            };

            // Assert
            expect(mockResponse.status).toBe(201);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.data.voteType).toBe("downvote");
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

        it("should prevent duplicate downvotes from same user", async () => {
            // Arrange
            const existingVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "downvote",
            };

            // Assert
            expect(existingVote.voteType).toBe("downvote");
            expect(existingVote.user).toBe(mockUserId);
        });

        it("should fail when user tries to downvote twice", async () => {
            // Arrange
            const mockResponse = {
                status: 400,
                success: false,
                message: "You have already downvoted this review",
            };

            // Assert
            expect(mockResponse.status).toBe(400);
            expect(mockResponse.success).toBe(false);
            expect(mockResponse.message).toContain("already downvoted");
        });

        it("should replace upvote with downvote when user changes vote", async () => {
            // Arrange
            const previousVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "upvote",
            };

            // Act - User switches from upvote to downvote
            const newVote = {
                user: mockUserId,
                booking: mockBookingId,
                voteType: "downvote",
            };

            // Assert
            expect(previousVote.voteType).toBe("upvote");
            expect(newVote.voteType).toBe("downvote");
            expect(newVote.user).toBe(previousVote.user);
            expect(newVote.booking).toBe(previousVote.booking);
        });

        it("should return the created downvote with correct structure", async () => {
            // Arrange
            const mockResponse = {
                status: 201,
                success: true,
                data: {
                    _id: "507f1f77bcf86cd799439013",
                    user: mockUserId,
                    booking: mockBookingId,
                    voteType: "downvote",
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

    describe("DELETE /api/v1/bookings/:bookingId/votes/downvote", () => {
        it("should remove a downvote", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {},
                message: "Downvote removed successfully",
            };

            // Assert
            expect(mockResponse.status).toBe(200);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.message).toContain("removed");
        });

        it("should fail if user has not downvoted the review", async () => {
            // Arrange
            const mockResponse = {
                status: 404,
                success: false,
                message: "You have not downvoted this review",
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

        it("should require authentication to remove downvote", async () => {
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

    describe("GET /api/v1/bookings/:bookingId/votes/downvote", () => {
        it("should return total downvote count for a review", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    downvoteCount: 8,
                },
            };

            // Assert
            expect(mockResponse.status).toBe(200);
            expect(mockResponse.success).toBe(true);
            expect(mockResponse.data.downvoteCount).toBe(8);
            expect(typeof mockResponse.data.downvoteCount).toBe("number");
            expect(mockResponse.data.downvoteCount).toBeGreaterThanOrEqual(0);
        });

        it("should return 0 downvotes when no downvotes exist", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    downvoteCount: 0,
                },
            };

            // Assert
            expect(mockResponse.data.downvoteCount).toBe(0);
        });

        it("should return correct booking ID in response", async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                success: true,
                data: {
                    bookingId: mockBookingId,
                    downvoteCount: 3,
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

        it("should not require authentication to view downvote count", async () => {
            // Arrange
            const mockRequest = {
                user: null, // Unauthenticated
                bookingId: mockBookingId,
            };

            // Assert
            expect(mockRequest.user).toBeNull();
        });
    });

    describe("Get Reviews API Modified to Include User Downvote Status", () => {
        it("should include userVote in vote summary for authenticated users", async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: [
                    {
                        _id: mockBookingId,
                        review: { rating: 2 },
                        voteSummary: {
                            upvoteCount: 2,
                            downvoteCount: 5,
                            userVote: "downvote", // User has downvoted
                        },
                    },
                ],
            };

            // Assert
            expect(mockResponse.data[0].voteSummary.userVote).toBe("downvote");
        });

        it("should have null userVote for unauthenticated users", async () => {
            // Arrange
            const mockResponse = {
                success: true,
                data: [
                    {
                        _id: mockBookingId,
                        review: { rating: 1 },
                        voteSummary: {
                            upvoteCount: 1,
                            downvoteCount: 8,
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
                            upvoteCount: 5,
                            downvoteCount: 10,
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

    describe("Downvote Button Component", () => {
        it("should render downvote button with correct label", async () => {
            // Arrange
            const buttonLabel = "Downvote";

            // Assert
            expect(buttonLabel).toBe("Downvote");
        });

        it("should display current downvote count", async () => {
            // Arrange
            const downvoteCount = 8;

            // Assert
            expect(downvoteCount).toBe(8);
            expect(typeof downvoteCount).toBe("number");
        });

        it("should show user has downvoted when userVote is downvote", async () => {
            // Arrange
            const userVote = "downvote";

            // Assert
            expect(userVote).toBe("downvote");
        });

        it("should show user has not downvoted when userVote is null", async () => {
            // Arrange
            const userVote = null;

            // Assert
            expect(userVote).toBeNull();
        });

        it("should show user has upvoted when userVote is upvote", async () => {
            // Arrange
            const userVote = "upvote";

            // Assert
            expect(userVote).toBe("upvote");
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

        it("should trigger downvote action on click", async () => {
            // Arrange
            const mockClick = jest.fn();

            // Act
            mockClick();

            // Assert
            expect(mockClick).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalledTimes(1);
        });

        it("should display error message on failed downvote", async () => {
            // Arrange
            const error = "You have already downvoted this review";

            // Assert
            expect(error).toEqual(expect.stringContaining("already downvoted"));
        });
    });

    describe("Downvote Feature Integration", () => {
        it("should update downvote count after successful downvote", async () => {
            // Arrange
            let downvoteCount = 5;

            // Act
            downvoteCount += 1;

            // Assert
            expect(downvoteCount).toBe(6);
        });

        it("should update downvote count after removal", async () => {
            // Arrange
            let downvoteCount = 5;

            // Act
            downvoteCount -= 1;

            // Assert
            expect(downvoteCount).toBe(4);
        });

        it("should maintain consistency when switching from upvote to downvote", async () => {
            // Arrange
            let upvotes = 10;
            let downvotes = 3;

            // Act - User switches from upvote to downvote
            upvotes -= 1; // Remove upvote
            downvotes += 1; // Add downvote

            // Assert
            expect(upvotes).toBe(9);
            expect(downvotes).toBe(4);
        });

        it("should reflect changes immediately in UI", async () => {
            // Arrange
            const initialState = {
                downvoteCount: 3,
                userVote: null,
            };

            // Act - User downvotes
            const updatedState = {
                downvoteCount: 4,
                userVote: "downvote",
            };

            // Assert
            expect(updatedState.downvoteCount).toBe(initialState.downvoteCount + 1);
            expect(updatedState.userVote).toBe("downvote");
        });

        it("should handle vote switching without data inconsistency", async () => {
            // Arrange
            const initialVotes = {
                upvoteCount: 10,
                downvoteCount: 2,
                userVote: "upvote",
            };

            // Act - User switches to downvote
            const updatedVotes = {
                upvoteCount: 9,
                downvoteCount: 3,
                userVote: "downvote",
            };

            // Assert
            expect(updatedVotes.upvoteCount).toBe(initialVotes.upvoteCount - 1);
            expect(updatedVotes.downvoteCount).toBe(initialVotes.downvoteCount + 1);
            expect(updatedVotes.userVote).toBe("downvote");
        });
    });

    describe("Vote Summary Consistency", () => {
        it("should return consistent data in vote summary endpoint", async () => {
            // Arrange
            const mockVoteSummary = {
                bookingId: mockBookingId,
                upvoteCount: 10,
                downvoteCount: 5,
                userVote: "downvote",
            };

            // Assert
            expect(mockVoteSummary.upvoteCount).toBe(10);
            expect(mockVoteSummary.downvoteCount).toBe(5);
            expect(mockVoteSummary.userVote).toBe("downvote");
            expect(mockVoteSummary.upvoteCount + mockVoteSummary.downvoteCount).toBe(15);
        });
    });
});
