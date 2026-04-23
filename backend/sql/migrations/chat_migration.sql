-- Migration: Group Chat System
USE wandermates;

-- Table to map activities/waves to chat rooms
CREATE TABLE IF NOT EXISTS group_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('activity', 'wave') NOT NULL,
    reference_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (type, reference_id)
);

-- Table to store actual messages
CREATE TABLE IF NOT EXISTS group_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_chat_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
