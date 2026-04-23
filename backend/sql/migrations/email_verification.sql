USE wandermates;

-- Table to store email verification codes
CREATE TABLE IF NOT EXISTS user_email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Procedure to verify email
DROP PROCEDURE IF EXISTS sp_verify_email;
DELIMITER //
CREATE PROCEDURE sp_verify_email(
    IN p_user_id INT,
    IN p_email VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET email_verified = 1, 
        trust_score = LEAST(100, trust_score + 10) 
    WHERE id = p_user_id AND email = p_email;
    
    SELECT 'Email verified successfully' AS message;
END //
DELIMITER ;
