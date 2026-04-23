USE wandermates;

-- Create Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stored Procedures for Emergency Contacts
DROP PROCEDURE IF EXISTS sp_get_emergency_contacts;
DELIMITER //
CREATE PROCEDURE sp_get_emergency_contacts(
  IN p_user_id INT
)
BEGIN
  SELECT id, name, relationship, phone_number, created_at
  FROM emergency_contacts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_add_emergency_contact;
DELIMITER //
CREATE PROCEDURE sp_add_emergency_contact(
  IN p_user_id INT,
  IN p_name VARCHAR(255),
  IN p_relationship VARCHAR(255),
  IN p_phone VARCHAR(20)
)
BEGIN
  INSERT INTO emergency_contacts (user_id, name, relationship, phone_number)
  VALUES (p_user_id, p_name, p_relationship, p_phone);
  
  -- Return updated list
  CALL sp_get_emergency_contacts(p_user_id);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_emergency_contact;
DELIMITER //
CREATE PROCEDURE sp_delete_emergency_contact(
  IN p_contact_id INT,
  IN p_user_id INT
)
BEGIN
  DELETE FROM emergency_contacts 
  WHERE id = p_contact_id AND user_id = p_user_id;
  
  -- Return updated list
  CALL sp_get_emergency_contacts(p_user_id);
END //
DELIMITER ;

-- Dummy SOS Procedure
DROP PROCEDURE IF EXISTS sp_send_sos;
DELIMITER //
CREATE PROCEDURE sp_send_sos(
  IN p_user_id INT,
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_message TEXT
)
BEGIN
  -- We could log SOS events here
  SELECT 'SOS alert sent to emergency contacts' AS status;
END //
DELIMITER ;
