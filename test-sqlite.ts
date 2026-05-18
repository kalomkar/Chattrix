import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE test (info TEXT)");
  db.run("INSERT INTO test VALUES (?)", ["Success"]);
  db.each("SELECT info FROM test", (err, row) => {
    console.log(row.info);
  });
});
db.close();
