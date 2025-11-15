README.md: när du söker LIA och jobb kan de be dig visa ett projekt du har gjort - använd README.md för att berätta om projektet.

Detta är ett projekt som kan behöva finslipning - men för närvande fungerar det som såhär;

1. Guests/Gäster
En gäst kan logga in utan lösenord, ta sig till chatten och välja valfri öppen kanal att chatta i. Denne kan också logga ut - däremot kan hen inte skapa en kanal, ta bort en kanal, skriva DM's eller ta bort några användare överhuvudtaget. Däremot kan en gäst registrera sig för att kunna logga in som en användare.

2. Users/Användare
En användare kan logga in, det med hashat lösenord som är unikt för denne. Som användare kan du skapa en ny kanal, du kan göra den öppen eller privat och du kan också ta bort den helt. Du kan också som användare se andra användare och klicka på dem för att chatta med dem i DMs. Du kan också logga ut och logga in igen om du så önskar, samt ta bort ditt konto om du så vill.

3. Admin
Admin kan göra allt som en användare kan, plus att den inte begränsas. Den kan ta bort vilka kanaler den vill eller vilka användare denne vill, inklusive sig själv.

Vi kan alltså chatta med flera eller med en specifik användare.
Jag använder mig av;
DynamoDB -> för mitt Table i AWS
Bcrypt -> kryptering
Cors -> Resource Sharing
Dotenv -> för min miljöfil .env
Express -> webbramverk för Node.js - bygger webbserver och API
jsonwebtoken -> verifiera tokens
react -> grunden i koden
vite -> grunden i koden
Typescript -> täta eventuella fel
uuid -> random generator för bland annat id
zod -> validering
Zustand -> statehantering

Jag kan inte specificera exakt var jag använder vad just nu då min hjärna är lite välkokt - men utöver detta så funkar i vilket fall sidan.
