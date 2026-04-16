const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get message history for a group (Activity or Wave)
router.get('/group/:type/:id', authenticateToken, async (req, res) => {
    const { type, id } = req.params;
    
    try {
        // 1. Check if group chat exists, create if not
        let groupResult = await db.query(
            'SELECT id FROM group_chats WHERE type = ? AND reference_id = ?',
            [type, id]
        );

        let chatRoomId;
        if (groupResult.length === 0) {
            const createRes = await db.query(
                'INSERT INTO group_chats (type, reference_id) VALUES (?, ?)',
                [type, id]
            );
            chatRoomId = createRes.insertId;
        } else {
            chatRoomId = groupResult[0].id;
        }

        // 2. Security Check: Is user a member of this trip?
        let isMember = false;
        if (type === 'activity') {
            const memberCheck = await db.query(
                'SELECT id FROM activity_rsvps WHERE activity_id = ? AND user_id = ? AND status = "confirmed"',
                [id, req.user.userId]
            );
            // Also check if they are the host
            const hostCheck = await db.query('SELECT host_id FROM activities WHERE id = ?', [id]);
            if (memberCheck.length > 0 || (hostCheck.length > 0 && hostCheck[0].host_id === req.user.userId)) {
                isMember = true;
            }
        } else if (type === 'wave') {
            const memberCheck = await db.query(
                'SELECT id FROM wave_requests WHERE wave_id = ? AND requester_id = ? AND status = "approved"',
                [id, req.user.userId]
            );
            const hostCheck = await db.query('SELECT host_id FROM waves WHERE id = ?', [id]);
            if (memberCheck.length > 0 || (hostCheck.length > 0 && hostCheck[0].host_id === req.user.userId)) {
                isMember = true;
            }
        }

        if (!isMember) {
            return res.status(403).json({ error: 'Messaging is restricted to confirmed members only.' });
        }

        // 3. Fetch messages
        const messages = await db.query(
            `SELECT m.id, m.group_chat_id, m.sender_id, m.message AS content, m.created_at, 
                    u.full_name as sender_name, u.profile_photo as sender_photo
             FROM group_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.group_chat_id = ?
             ORDER BY m.created_at ASC 
             LIMIT 100`,
            [chatRoomId]
        );

        res.json({ chatRoomId, messages });
    } catch (error) {
        console.error('Fetch group messages error:', error);
        res.status(500).json({ error: 'Server error fetching chat history' });
    }
});

module.exports = router;
