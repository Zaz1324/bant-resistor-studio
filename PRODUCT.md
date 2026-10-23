# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Tauri masaüstü kabuğu içinde HTML, CSS ve TypeScript. Kullanıcı HTML ve Tauri istemiştir; çatı seçimi yalın bir Vite uygulaması olarak uygulanmıştır.

## Users
Elektronik projelerinde direnç seçen mühendisler ve elektronikle ilgilenen kişiler.

## Product Purpose
Dört veya beş bantlı bir direncin renklerinden nominal ohm değerini ve tolerans aralığını anında bulmak; istenen ohm değerini kapsayan direnç seçeneklerini göstermek.

## Operating Context
Bilgisayarda çevrimdışı çalışan, proje sırasında hızlıca başvurulan bir masaüstü aracı.

## Capabilities and Constraints
- Dört bant: iki anlamlı rakam, çarpan, tolerans; renksiz tolerans bandı ±20% verir.
- Beş bant: üç anlamlı rakam, çarpan, tolerans.
- Her bantta sadece o konum için geçerli renkler seçilebilir.
- Seçilen direnç çizimi, nominal değer ve tolerans sınırları gösterilir; çizim PNG olarak kaydedilebilir.
- Hedef değer araması E24 serisini varsayılan kullanır ve tüm geçerli kombinasyonlara geçebilir.
- Kullanıcı Windows bilgisayarına kurulabilir Tauri uygulaması istemiştir.
- Dirençler ad ve kategoriyle favorilere kaydedilir; kayıtlar sürüm güncellemesinde aynı uygulama veri klasöründen yüklenir.
- Dağıtım kurulum dosyasıyla yapılır; özgün kaynak kodu özel tutulur.
- Ürün adı ve görsel kimlik uygulama içinde çalışma adı olarak seçilmiştir; kullanıcı tarafından verilmemiştir.

## Product Principles
- Renk seçiminden hesaplamaya tek adımda geç.
- Birimleri ve tolerans sınırlarını açıkça göster.
- Bant konumlarının farklı kurallarını kullanıcıya görünür kıl.
- Arama sonuçlarını gerçek kullanım kararı verebilecek biçimde sun.
