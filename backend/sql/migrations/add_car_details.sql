-- Migration: Add car details to waves table
USE wandermates;

ALTER TABLE waves 
ADD COLUMN car_model VARCHAR(255) AFTER description,
ADD COLUMN car_number VARCHAR(50) AFTER car_model;
