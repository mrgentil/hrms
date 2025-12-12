-- Fix Database Schema Safely
-- This script uses a stored procedure to check if columns exist before adding them.
-- It avoids "Duplicate column name" errors.

DELIMITER //

DROP PROCEDURE IF EXISTS SafeAddColumn //

CREATE PROCEDURE SafeAddColumn(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDef VARCHAR(255)
)
BEGIN
    DECLARE colCount INT;
    
    SELECT COUNT(*) INTO colCount
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND COLUMN_NAME = columnName;
    
    IF colCount = 0 THEN
        SET @s = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDef);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Added column ', columnName, ' to ', tableName) AS status;
    ELSE
        SELECT CONCAT('Column ', columnName, ' already exists in ', tableName) AS status;
    END IF;
END //

DELIMITER ;

-- Execute Safe Updates
CALL SafeAddColumn('salary_advance', 'paid_at', 'DATETIME(3) NULL');
CALL SafeAddColumn('salary_advance', 'payment_method', 'VARCHAR(50) NULL');
CALL SafeAddColumn('salary_advance', 'payment_reference', 'VARCHAR(100) NULL');

CALL SafeAddColumn('benefit_catalog', 'value_percentage', 'DECIMAL(5, 2) NULL');

CALL SafeAddColumn('employee_benefit', 'enrolled_at', 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
CALL SafeAddColumn('employee_benefit', 'notes', 'TEXT NULL');

-- Clean up
DROP PROCEDURE SafeAddColumn;
