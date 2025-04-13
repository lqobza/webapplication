CREATE OR ALTER PROCEDURE [dbo].[SearchMerchandise] @PageNumber INT = 1,
                                                    @PageSize INT = 10,
                                                    @Keywords NVARCHAR(255) = NULL,
                                                    @MinPrice INT = NULL,
                                                    @MaxPrice INT = NULL,
                                                    @CategoryId INT = NULL,
                                                    @SortBy NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- First get distinct merchandise IDs that match the filter criteria
    WITH MatchingMerch AS (SELECT DISTINCT m.id,
                                           m.name,
                                           m.price
                           FROM dbo.Merch m
                           WHERE (@Keywords IS NULL OR m.name LIKE '%' + @Keywords + '%')
                             AND (@MinPrice IS NULL OR m.price >= @MinPrice)
                             AND (@MaxPrice IS NULL OR m.price <= @MaxPrice)
                             AND (@CategoryId IS NULL OR m.category_id = @CategoryId)),
         -- Apply sorting and pagination to the distinct merchandise IDs
         SortedMerch AS (SELECT id,
                                ROW_NUMBER() OVER (
                                    ORDER BY
                                        CASE WHEN @SortBy = 'NameAsc' THEN name END ASC,
                                        CASE WHEN @SortBy = 'NameDesc' THEN name END DESC,
                                        CASE WHEN @SortBy = 'PriceAsc' THEN price END ASC,
                                        CASE WHEN @SortBy = 'PriceDesc' THEN price END DESC,
                                        CASE WHEN @SortBy IS NULL OR @SortBy = '' THEN id END ASC
                                    )            AS RowNum,
                                COUNT(*) OVER () AS TotalCount
                         FROM MatchingMerch),
         -- Get the paginated merchandise IDs
         PaginatedMerch AS (SELECT id,
                                   TotalCount
                            FROM SortedMerch
                            WHERE RowNum > @Offset
                              AND RowNum <= (@Offset + @PageSize))
         -- Join back to get all the detailed information
    SELECT m.id,
           m.category_id,
           c.name     AS CategoryName,
           m.name,
           m.price,
           m.description,
           m.brand_id,
           b.name     AS BrandName,
           t.id       AS theme_id,
           t.name     AS theme_name,
           ms.id      AS size_id,
           ms.size    AS size_name,
           ms.instock AS size_in_stock,
           p.TotalCount
    FROM PaginatedMerch p
             INNER JOIN
         dbo.Merch m ON p.id = m.id
             INNER JOIN
         dbo.Category c ON m.category_id = c.id
             INNER JOIN
         dbo.Brand b ON m.brand_id = b.id
             LEFT JOIN
         dbo.MerchTheme mt ON m.id = mt.merch_id
             LEFT JOIN
         dbo.Theme t ON mt.theme_id = t.id
             LEFT JOIN
         dbo.MerchSize ms ON m.id = ms.merch_id
    ORDER BY CASE WHEN @SortBy = 'NameAsc' THEN m.name END ASC,
             CASE WHEN @SortBy = 'NameDesc' THEN m.name END DESC,
             CASE WHEN @SortBy = 'PriceAsc' THEN m.price END ASC,
             CASE WHEN @SortBy = 'PriceDesc' THEN m.price END DESC,
             CASE WHEN @SortBy IS NULL OR @SortBy = '' THEN m.id END ASC;
END 