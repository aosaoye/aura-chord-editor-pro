const fs = require('fs');
const filePath = 'app/community/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/import StarRatingInteractive from \"\.\.\/components\/StarRatingInteractive\";/g, '');
content = content.replace(/import { Music, Clock } from \"lucide-react\";/g, 'import { Music, Clock, Star } from \"lucide-react\";');

const before = `                          const myRating = userId ? song.ratings.find((r: { userId: string, value: number }) => r.userId === userId)?.value || 0 : 0;
                          const isOwner = userId === song.user.clerkId;

                          return (
                            <div className="flex items-center gap-2 ml-auto" title={isOwner ? "No puedes votar tu propia obra" : "Valora esta obra"}>
                              <StarRatingInteractive 
                                songId={song.id} 
                                myInitialRating={myRating} 
                                readOnly={!userId || isOwner} 
                              />
                              <span className="text-[10px] font-bold text-muted-foreground">({avgRating})</span>
                            </div>
                          );`;

const after = `                          return (
                            <div className="flex items-center gap-1 ml-auto text-yellow-500">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[10px] font-bold text-muted-foreground ml-1">({avgRating})</span>
                            </div>
                          );`;

if(content.includes(before)) {
  content = content.replace(before, after);
  console.log("Success replacing block");
} else {
  console.log("Block not found");
}

fs.writeFileSync(filePath, content);
