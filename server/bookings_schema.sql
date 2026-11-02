CREATE TABLE IF NOT EXISTS study_bookings (
  id VARCHAR(10) PRIMARY KEY,
  property_id VARCHAR(40) NOT NULL,
  property_name VARCHAR(150),
  booked_by VARCHAR(10) NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  note VARCHAR(200),
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booked_by) REFERENCES members(id)
);