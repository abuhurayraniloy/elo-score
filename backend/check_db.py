import database, models
db = database.SessionLocal()
print("Total photos in DB:", db.query(models.Photo).count())
print("System photos (user_id=None):", db.query(models.Photo).filter(models.Photo.user_id == None).count())
print("User photos (user_id!=None):", db.query(models.Photo).filter(models.Photo.user_id != None).count())
print("Active tournament matches:", db.query(models.TournamentMatch).filter(models.TournamentMatch.is_active == True).count())
print("Incomplete tournament matches:", db.query(models.TournamentMatch).filter(models.TournamentMatch.winner_id == None).count())
db.close()
