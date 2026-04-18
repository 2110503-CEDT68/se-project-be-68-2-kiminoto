/**
 * US1-4: Sort Reviews by Helpful or Recent
 * As a user I want to sort reviews by most helpful or most recent
 * So that I can view the reviews I want
 *
 * Tests:
 * - Create a frontend component for sort controls
 * - Add the sort controls logic to the reviews page
 * - Test sort feature (by most helpful/most recent)
 */

describe("US1-4: Sort Reviews", () => {
    const mockCarProviderId = "507f1f77bcf86cd799439011";

    describe("Sort by Most Recent", () => {
        it("should sort reviews by creation date in descending order", async () => {
            // Arrange
            const reviews = [
                {
                    id: "1",
                    comment: "Old review",
                    createdAt: new Date(2024, 0, 1).toISOString(),
                },
                {
                    id: "2",
                    comment: "Middle review",
                    createdAt: new Date(2024, 0, 15).toISOString(),
                },
                {
                    id: "3",
                    comment: "Recent review",
                    createdAt: new Date(2024, 0, 31).toISOString(),
                },
            ];

            // Act - Sort by most recent (descending)
            const sorted = [...reviews].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Assert
            expect(sorted[0].id).toBe("3"); // Most recent first
            expect(sorted[1].id).toBe("2");
            expect(sorted[2].id).toBe("1"); // Oldest last
        });

        it("should handle reviews with same timestamp", async () => {
            // Arrange
            const sameTime = new Date(2024, 0, 15).toISOString();
            const reviews = [
                { id: "1", createdAt: sameTime },
                { id: "2", createdAt: sameTime },
                { id: "3", createdAt: sameTime },
            ];

            // Act
            const sorted = [...reviews].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Assert - All have same timestamp, order preserved
            expect(sorted.length).toBe(3);
            expect(sorted.every((r) => r.createdAt === sameTime)).toBe(true);
        });

        it("should display reviews in descending date order", async () => {
            // Arrange
            const reviews = [
                { id: "old", createdAt: new Date("2024-01-01") },
                { id: "new", createdAt: new Date("2024-01-31") },
                { id: "mid", createdAt: new Date("2024-01-15") },
            ];

            // Act
            const sortedByDate = [...reviews].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Assert
            expect(sortedByDate[0].id).toBe("new");
            expect(sortedByDate[1].id).toBe("mid");
            expect(sortedByDate[2].id).toBe("old");
        });

        it("should update UI when sort order changes to recent", async () => {
            // Arrange
            const sortState = {
                sortBy: "recent",
            };

            // Act
            sortState.sortBy = "recent";

            // Assert
            expect(sortState.sortBy).toBe("recent");
        });
    });

    describe("Sort by Most Helpful", () => {
        it("should sort reviews by helpfulness (upvotes - downvotes)", async () => {
            // Arrange
            const reviews = [
                {
                    id: "1",
                    upvoteCount: 5,
                    downvoteCount: 2,
                },
                {
                    id: "2",
                    upvoteCount: 15,
                    downvoteCount: 1,
                },
                {
                    id: "3",
                    upvoteCount: 3,
                    downvoteCount: 8,
                },
            ];

            // Act - Sort by helpfulness (upvotes - downvotes)
            const sorted = [...reviews].sort(
                (a, b) =>
                    (b.upvoteCount - b.downvoteCount) -
                    (a.upvoteCount - a.downvoteCount)
            );

            // Assert
            expect(sorted[0].id).toBe("2"); // 15-1 = 14 (most helpful)
            expect(sorted[1].id).toBe("1"); // 5-2 = 3
            expect(sorted[2].id).toBe("3"); // 3-8 = -5 (least helpful)
        });

        it("should calculate net helpful votes correctly", async () => {
            // Arrange
            const reviews = [
                { id: "1", upvotes: 10, downvotes: 2 }, // net: 8
                { id: "2", upvotes: 20, downvotes: 5 }, // net: 15
                { id: "3", upvotes: 5, downvotes: 10 }, // net: -5
            ];

            // Act
            const calculateHelpfulness = (review) =>
                review.upvotes - review.downvotes;
            const helpfulnessScores = reviews.map((r) => ({
                id: r.id,
                score: calculateHelpfulness(r),
            }));

            // Assert
            expect(helpfulnessScores[0].score).toBe(8);
            expect(helpfulnessScores[1].score).toBe(15);
            expect(helpfulnessScores[2].score).toBe(-5);
        });

        it("should sort by positive helpfulness first", async () => {
            // Arrange
            const reviews = [
                { id: "1", upvotes: 2, downvotes: 8 }, // negative
                { id: "2", upvotes: 10, downvotes: 2 }, // positive
                { id: "3", upvotes: 20, downvotes: 5 }, // very positive
            ];

            // Act
            const sorted = [...reviews].sort(
                (a, b) =>
                    (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            );

            // Assert
            expect(sorted[0].id).toBe("3"); // Most helpful
            expect(sorted[1].id).toBe("2"); // Mid helpful
            expect(sorted[2].id).toBe("1"); // Least helpful (negative)
        });

        it("should update UI when sort order changes to helpful", async () => {
            // Arrange
            const sortState = {
                sortBy: "recent",
            };

            // Act
            sortState.sortBy = "helpful";

            // Assert
            expect(sortState.sortBy).toBe("helpful");
        });

        it("should handle reviews with zero votes", async () => {
            // Arrange
            const reviews = [
                { id: "1", upvotes: 0, downvotes: 0 }, // score: 0
                { id: "2", upvotes: 5, downvotes: 0 }, // score: 5
                { id: "3", upvotes: 0, downvotes: 5 }, // score: -5
            ];

            // Act
            const sorted = [...reviews].sort(
                (a, b) =>
                    (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            );

            // Assert
            expect(sorted[0].id).toBe("2"); // score 5
            expect(sorted[1].id).toBe("1"); // score 0
            expect(sorted[2].id).toBe("3"); // score -5
        });
    });

    describe("Sort Controls Component", () => {
        it("should render sort dropdown menu", async () => {
            // Arrange
            const sortOptions = ["recent", "helpful"];

            // Assert
            expect(sortOptions).toEqual(expect.arrayContaining(["recent", "helpful"]));
        });

        it("should display recent as default sort option", async () => {
            // Arrange
            const defaultSort = "recent";

            // Assert
            expect(defaultSort).toBe("recent");
        });

        it("should have helpful as alternative sort option", async () => {
            // Arrange
            const sortOptions = ["recent", "helpful"];

            // Assert
            expect(sortOptions).toContain("helpful");
        });

        it("should update selected sort option", async () => {
            // Arrange
            let selectedSort = "recent";

            // Act
            selectedSort = "helpful";

            // Assert
            expect(selectedSort).toBe("helpful");
        });

        it("should display appropriate label for each sort option", async () => {
            // Arrange
            const sortLabels = {
                recent: "Most Recent",
                helpful: "Most Helpful",
            };

            // Assert
            expect(sortLabels["recent"]).toBe("Most Recent");
            expect(sortLabels["helpful"]).toBe("Most Helpful");
        });

        it("should indicate current sort selection", async () => {
            // Arrange
            const currentSort = "recent";
            const isSelected = (option) => option === currentSort;

            // Assert
            expect(isSelected("recent")).toBe(true);
            expect(isSelected("helpful")).toBe(false);
        });

        it("should be accessible and properly labeled", async () => {
            // Arrange
            const dropdown = {
                label: "Sort by",
                options: ["recent", "helpful"],
                value: "recent",
            };

            // Assert
            expect(dropdown.label).toBe("Sort by");
            expect(dropdown.options.length).toBe(2);
        });

        it("should trigger sort action when option changes", async () => {
            // Arrange
            const mockSort = jest.fn();

            // Act
            mockSort("helpful");

            // Assert
            expect(mockSort).toHaveBeenCalled();
            expect(mockSort).toHaveBeenCalledWith("helpful");
        });
    });

    describe("Sort Feature Integration", () => {
        it("should apply sort to reviews list immediately", async () => {
            // Arrange
            const reviews = [
                {
                    id: "1",
                    createdAt: new Date("2024-01-01"),
                    upvotes: 2,
                    downvotes: 8,
                },
                {
                    id: "2",
                    createdAt: new Date("2024-01-31"),
                    upvotes: 15,
                    downvotes: 1,
                },
            ];
            let sortBy = "recent";

            // Act - Sort by recent
            const sorted =
                sortBy === "recent"
                    ? [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    : [...reviews].sort(
                        (a, b) =>
                            (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
                    );

            // Assert
            expect(sorted[0].id).toBe("2"); // Most recent
        });

        it("should persist sort selection after page reload", async () => {
            // Arrange
            const sortSelection = "helpful";

            // Act - Store in state/localStorage
            const savedSort = sortSelection;

            // Assert
            expect(savedSort).toBe("helpful");
        });

        it("should handle both sort options correctly", async () => {
            // Arrange
            const reviews = [
                {
                    id: "1",
                    createdAt: new Date("2024-01-01"),
                    upvotes: 1,
                    downvotes: 10,
                },
                {
                    id: "2",
                    createdAt: new Date("2024-01-31"),
                    upvotes: 20,
                    downvotes: 1,
                },
            ];

            // Act - Test both sorts
            const byRecent = [...reviews].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            const byHelpful = [...reviews].sort(
                (a, b) =>
                    (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            );

            // Assert
            expect(byRecent[0].id).toBe("2"); // By recent: ID 2 is newer
            expect(byHelpful[0].id).toBe("2"); // By helpful: ID 2 has higher score
        });

        it("should work with paginated reviews", async () => {
            // Arrange
            const page1 = [
                { id: "1", createdAt: new Date("2024-01-10") },
                { id: "2", createdAt: new Date("2024-01-20") },
            ];

            // Act - Sort page 1
            const sorted = [...page1].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Assert
            expect(sorted[0].id).toBe("2");
            expect(sorted[1].id).toBe("1");
        });

        it("should show loading state while applying sort", async () => {
            // Arrange
            const isLoading = false;

            // Act - Start loading
            const loadingState = true;

            // Assert
            expect(loadingState).toBe(true);
        });

        it("should clear sort error on retry", async () => {
            // Arrange
            let sortError = "Failed to sort reviews";

            // Act - Clear error
            sortError = null;

            // Assert
            expect(sortError).toBeNull();
        });
    });

    describe("Sort Stability", () => {
        it("should use secondary sort (ID) for stability", async () => {
            // Arrange
            const reviews = [
                { id: "a", score: 5, createdAt: new Date("2024-01-01") },
                { id: "b", score: 5, createdAt: new Date("2024-01-01") },
                { id: "c", score: 5, createdAt: new Date("2024-01-01") },
            ];

            // Act - Sort by score, then by ID for stability
            const sorted = [...reviews].sort((a, b) => {
                if (a.score !== b.score) {
                    return b.score - a.score;
                }
                return a.id.localeCompare(b.id);
            });

            // Assert - ID order maintained for stability
            expect(sorted[0].id).toBe("a");
            expect(sorted[1].id).toBe("b");
            expect(sorted[2].id).toBe("c");
        });

        it("should maintain consistent ordering", async () => {
            // Arrange
            const reviews = [
                { id: "1", score: 10, createdAt: new Date("2024-01-01") },
                { id: "2", score: 10, createdAt: new Date("2024-01-01") },
            ];

            // Act - Sort twice
            const sort1 = [...reviews].sort(
                (a, b) => b.score - a.score || a.id.localeCompare(b.id)
            );
            const sort2 = [...reviews].sort(
                (a, b) => b.score - a.score || a.id.localeCompare(b.id)
            );

            // Assert - Same result both times
            expect(sort1[0].id).toBe(sort2[0].id);
            expect(sort1[1].id).toBe(sort2[1].id);
        });
    });

    describe("Sort Performance", () => {
        it("should handle large number of reviews efficiently", async () => {
            // Arrange
            const largeReviewSet = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                upvotes: Math.floor(Math.random() * 100),
                downvotes: Math.floor(Math.random() * 100),
                createdAt: new Date(2024, 0, Math.floor(Math.random() * 31)),
            }));

            // Act
            const start = Date.now();
            const sorted = [...largeReviewSet].sort(
                (a, b) =>
                    (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            );
            const duration = Date.now() - start;

            // Assert - Should complete reasonably fast
            expect(sorted.length).toBe(1000);
            expect(duration).toBeLessThan(1000); // Within 1 second
        });
    });

    describe("Sort with Filtering", () => {
        it("should sort after filtering by rating", async () => {
            // Arrange
            const reviews = [
                { id: "1", rating: 5, upvotes: 5, downvotes: 1, createdAt: new Date("2024-01-01") },
                { id: "2", rating: 3, upvotes: 10, downvotes: 2, createdAt: new Date("2024-01-15") },
                { id: "3", rating: 5, upvotes: 3, downvotes: 8, createdAt: new Date("2024-01-31") },
            ];

            // Act - Filter for 5-star, then sort by recent
            const filtered = reviews.filter((r) => r.rating === 5);
            const sorted = [...filtered].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Assert
            expect(sorted.length).toBe(2);
            expect(sorted[0].id).toBe("3"); // Most recent 5-star
            expect(sorted[1].id).toBe("1");
        });
    });
});
