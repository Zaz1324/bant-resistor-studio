# Bant

Dört ve beş bantlı dirençler için çevrimdışı renk kodu ve değer arama aracı. HTML, CSS ve TypeScript arayüzü Tauri 2 ile Windows masaüstüne paketlenir. Dirençler ad ve kategoriyle favorilere kaydedilebilir.

> **Yayın durumu — 24 Ekim 2026:** GitHub'daki indirilebilir son sürüm `v1.1.1` taşınabilir EXE'dir. Dosya imzasızdır; Windows SmartScreen uyarısı gösterebilir ve bazı yönetilen bilgisayarlarda çalıştırılması engellenebilir. `v1.1.2` yükleyicisi henüz yalnızca imzasız CI test adayıdır; GitHub Release olarak yayımlanmamıştır.

## Çalıştırma

```powershell
npm install
npm run desktop:dev
```

Tarayıcıda arayüzü görmek için `npm run dev` yeterlidir. PNG kaydetme tarayıcıda indirme olarak, Tauri içinde yerel dosya seçicisiyle çalışır.

## Windows'ta doğrudan kullanma

[Bant v1.1.1 sürümünden](https://github.com/Zaz1324/bant-resistor-studio/releases/tag/v1.1.1) `Bant_1.1.1_x64.exe` dosyasını indirin ve açın. Bu sürüm taşınabilirdir; kurulum veya kaynak kodu indirmek gerekmez. Windows 10/11 x64 ve WebView2 Runtime gerekir. Runtime eksikse [Microsoft'un WebView2 Runtime yükleyicisi](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) ayrıca kurulmalıdır. Runtime hazır olduğunda uygulama işlevleri çevrimdışı çalışır.

Favoriler 1.1.0'dan itibaren Tauri'nin uygulama veri klasöründeki `bant-library.json` dosyasında saklanır. Aynı uygulama kimliğiyle yeni EXE dosyası açıldığında kayıtlar kullanılmaya devam eder. Dosyadaki kurulum kimliği gizli anahtar veya lisans doğrulaması değildir.

Derleme için Rust MSVC, Microsoft C++ Build Tools ve Node.js gerekir. `npm ci` ardından `npm run desktop:build` komutu `src-tauri/target/release/bant.exe` dosyasını oluşturur. GitHub sürümleri Windows üzerinde aynı adımları test ederek otomatik derler. Kaynak kodu edinirken `node_modules`, `dist` ve `src-tauri/target` klasörleri gerekli değildir; bunlar yerel derlemede yeniden oluşur.

Bu EXE'nin yayıncı imzası yoktur. SmartScreen uyarısı, dosyanın zararlı olduğunu tek başına kanıtlamaz; dosyanın güvenilir yayıncı itibarının henüz oluşmadığını belirtir. Yalnızca yukarıdaki resmî GitHub sürüm bağlantısını kullanın. Sürüm açıklamasındaki SHA-256 değeri indirdiğiniz dosyanın bütünlüğünü karşılaştırmak içindir; yayıncı imzasının yerini tutmaz. Dosyayı çalıştırma kararı kullanıcıya aittir.

## GitHub için tek dosyalık yükleyici

`npm run desktop:installer` Windows'ta kullanıcı hesabına kurulan bir NSIS `-setup.exe` dosyası oluşturur. WebView2 Runtime eksikse yükleyici Microsoft'un küçük çevrimiçi kurucusunu indirir; bu durumda ilk kurulum için internet gerekir. GitHub Actions her `main` güncellemesinde yükleyiciyi **imzasız test adayı** olarak derler ve boyutunu raporlar. Test adayı halka açık sürüm değildir.

GitHub'da yayınlanacak yükleyici ve içindeki uygulama EXE'si güvenilir bir yayıncı sertifikasıyla Authenticode imzalanıp doğrulanmalıdır. Sertifika veya özel anahtar depoya eklenmemelidir. İmzalı yeni dosyalarda da SmartScreen itibarı oluşana kadar uyarı görülebilir; GitHub üzerinden ilk indirmede uyarısız açılış garantisi yoktur.

## Hesaplama

Dört bantta ilk iki bant anlamlı rakamları, üçüncü çarpanı, dördüncü toleransı belirler. Renksiz tolerans bandı ±20% olarak hesaplanır. Beş bantta ilk üç bant anlamlı rakamları, dördüncü çarpanı, beşinci toleransı belirler. Arama, hedef ohm değerinin nominal değerin tolerans aralığında kalması koşulunu kullanır. E24 varsayılandır; E96, üç anlamlı rakam gerektirdiği için yalnızca beş bantta seçilebilir. “Tüm değerler” seçeneği seçilen bant sayısına göre geçerli renk kombinasyonlarını tarar. Arama sonuçları gerçek stok garantisi değildir.

Renk ve standart seri eşlemeleri: [Vishay direnç renk kodu tablosu](https://www.vishay.com/docs/49411/resistor_color_code_calculator.pdf), [Vishay standart değer serileri](https://www.vishay.com/docs/20143/colorcod.pdf).

## Lisans

Bu proje kaynak kodu incelenebilir olarak yayımlanır; [Bant Kullanım Lisansı](LICENSE) yazılımın değiştirilmemiş hâlinin kullanılmasına izin verir. Kaynak kodun değiştirilmesi, yeniden kullanılması ve dağıtılması yasaktır. Katkı sahipleri: [fx-82MS](https://github.com/fx-82MS) ve Bant contributors.

Kurulum dosyası kaynak dosyalarını içermez; masaüstü HTML/JavaScript paketleri teknik olarak incelenebilir. Üçüncü taraf bileşenlerin kendi lisansları geçerlidir.
