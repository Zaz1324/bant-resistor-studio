# Bant

Dört ve beş bantlı dirençler için çevrimdışı renk kodu ve değer arama aracı. HTML, CSS ve TypeScript arayüzü Tauri 2 ile Windows masaüstüne paketlenir. Dirençler ad ve kategoriyle favorilere kaydedilebilir.

## Çalıştırma

```powershell
npm install
npm run desktop:dev
```

Tarayıcıda arayüzü görmek için `npm run dev` yeterlidir. PNG kaydetme tarayıcıda indirme olarak, Tauri içinde yerel dosya seçicisiyle çalışır.

## Windows kurulum dosyası

Windows kurulum dosyası GitHub deposunun **Releases** bölümünde yayımlanır. Windows 64 bit üzerinde dosyayı çalıştırıp kurulum adımlarını izleyin. Her sürümün SHA-256 değeri kurulum dosyasıyla birlikte verilir.

Yeni kurulum aynı ürün adı ve uygulama kimliğiyle eski sürümün yerini alır. 1.1.0'dan itibaren favoriler Tauri'nin uygulama veri klasöründeki `bant-library.json` dosyasında tutulur. Dosyada sürümlü veri yapısı ve kalıcı bir kurulum kimliği bulunur; sonraki sürüm bu dosyayı açarak favorileri otomatik kullanır. 1.0.0 ve 1.0.1 sürümlerinde favori kaydı olmadığı için onlardan aktarılacak favori verisi yoktur. Kurulum kimliği gizli anahtar veya lisans doğrulaması değildir.

Rust MSVC, Microsoft C++ Build Tools ve WebView2 geliştirme önkoşulları kurulduktan sonra:

```powershell
npm run desktop:build
```

NSIS kurulum dosyası `src-tauri/target/release/bundle/nsis/` içinde oluşur. Uygulama çevrimdışı çalışır. WebView2 bu Windows kurulumunda zaten mevcut; eksik olan bir bilgisayarda paketteki WebView2 önyükleyicisi çalışma zamanını kurmak için internet bağlantısı ister. Kurulum dosyası kod imzası taşımaz; Windows SmartScreen ilk çalıştırmada uyarı gösterebilir.

## Hesaplama

Dört bantta ilk iki bant anlamlı rakamları, üçüncü çarpanı, dördüncü toleransı belirler. Renksiz tolerans bandı ±20% olarak hesaplanır. Beş bantta ilk üç bant anlamlı rakamları, dördüncü çarpanı, beşinci toleransı belirler. Arama, hedef ohm değerinin nominal değerin tolerans aralığında kalması koşulunu kullanır. E24 varsayılandır; “Tüm değerler” seçeneği seçilen bant sayısına göre geçerli renk kombinasyonlarını tarar. Arama sonuçları gerçek stok garantisi değildir.

Renk ve standart seri eşlemeleri: [Vishay direnç renk kodu tablosu](https://www.vishay.com/docs/49411/resistor_color_code_calculator.pdf), [Vishay standart değer serileri](https://www.vishay.com/docs/20143/colorcod.pdf).

## Açık kaynak

Bu proje [MIT Lisansı](LICENSE) ile yayımlanır. Katkı sahipleri: [fx-82MS](https://github.com/fx-82MS) ve Bant contributors.

Kurulum dosyası kaynak dosyalarını içermez; masaüstü HTML/JavaScript paketleri teknik olarak incelenebilir. Üçüncü taraf bileşenlerin kendi lisansları geçerlidir.
