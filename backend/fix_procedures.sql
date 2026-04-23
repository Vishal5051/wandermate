USE wandermates;

DROP PROCEDURE IF EXISTS sp_get_user_by_email;
DELIMITER //
CREATE PROCEDURE sp_get_user_by_email(
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT id, email, password_hash, full_name, username, gender,
         profile_photo, bio, trust_score, verification_level, is_verified, role
  FROM users WHERE email = p_email OR username = p_email LIMIT 1;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_submit_aadhaar_verification;
DELIMITER //
CREATE PROCEDURE sp_submit_aadhaar_verification(
  IN p_user_id INT,
  IN p_aadhaar_number_masked VARCHAR(20),
  IN p_aadhaar_photo_url VARCHAR(500),
  IN p_profile_photo_url VARCHAR(500)
)
BEGIN
  UPDATE users
  SET 
    aadhaar_number_masked = p_aadhaar_number_masked,
    aadhaar_photo_url = p_aadhaar_photo_url,
    profile_photo = COALESCE(p_profile_photo_url, profile_photo),
    aadhaar_status = 'pending'
  WHERE id = p_user_id;
  
  -- Increase trust score slightly for submitting
  UPDATE users SET trust_score = trust_score + 5 WHERE id = p_user_id AND trust_score < 95;
  
  SELECT 'Verification submitted successfully' AS message;
END //
DELIMITER ;
