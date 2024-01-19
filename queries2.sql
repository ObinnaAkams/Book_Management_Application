DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  ISBN VARCHAR(50) UNIQUE NOT NULL,
  authorName VARCHAR(100) NOT NULL CHECK (authorName <> ''),
  bookName  VARCHAR(100) NOT NULL CHECK (bookName <> ''),
  coverImgPath TEXT,
  rating INTEGER NOT NULL,
  readDate DATE NOT NULL,
  bookSummary VARCHAR(1000) NOT NULL CHECK (bookSummary <> '')
);



INSERT INTO books (ISBN, authorName, bookName, coverImgPath, rating, readDate, bookSummary)
VALUES
  ('9780310332909', 
  'Ben Carson, M.D', 
  'Gifted Hands:The Ben Carson Story', 
  '/assets/icons/giftedHand.jpg',
  5,'Gifted Hands reveals the remarkable journey of Dr. Ben Carson from an angry, struggling young 
   boy with everything stacked against him to the director of pediatric neurosurgery at the Johns 
   Hopkins Children''s Center. As a boy, he did poorly in school and struggled with anger.
   If it were not for the persistence of his mother, a single parent who worked three jobs and pushed 
   her sons to do their best, his story may have ended tragically. Join Dr. Carson on his journey 
   from a struggling inner-city student to the pinnacle of his career as a world-renowned 
   neurosurgeon.
  '2023-12-14', 
  '
);

