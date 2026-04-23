USE wandermates;

-- Create SOS Logs Table
CREATE TABLE IF NOT EXISTS sos_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  message TEXT,
  status VARCHAR(50) DEFAULT 'received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update SOS Procedure to LOG every event
DROP PROCEDURE IF EXISTS sp_send_sos;
DELIMITER //
CREATE PROCEDURE sp_send_sos(
  IN p_user_id INT,
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_message TEXT
)
BEGIN
  -- Insert into logs for verifiability
  INSERT INTO sos_logs (user_id, latitude, longitude, message)
  VALUES (p_user_id, p_latitude, p_longitude, p_message);
  
  -- Return success acknowledge
  SELECT 'SOS Logged & Signal Received' AS status;
END //
DELIMITER ;

-- Procedure to get user's SOS history
DROP PROCEDURE IF EXISTS sp_get_user_sos_history;
DELIMITER //
CREATE PROCEDURE sp_get_user_sos_history(
  IN p_user_id INT
)
BEGIN
  SELECT id, latitude, longitude, message, status, created_at
  FROM sos_logs
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 5;
END //
DELIMITER ;
