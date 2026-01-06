# PDF İndirme Sorun Giderme

## Eğer PDF hala .pdf uzantısıyla inmiyorsa:

### Chrome için:
1. Chrome Ayarlar → İndirmeler
2. "İndirmeden önce her dosyanın kaydedileceği yeri sor" seçeneğini AÇIN
3. Tekrar deneyin - dosya adını manuel girebileceksiniz

### Alternatif Test:
1. Tarayıcı konsolunu açın (F12)
2. PDF İndir butonuna tıklayın
3. Konsola şunu yazın:
```javascript
console.log('Son indirilen dosya adı:', document.querySelector('a[download]')?.getAttribute('download'));
```

### Manuel Test Kodu:
Konsola yapıştırın ve Enter'a basın:
```javascript
const testBlob = new Blob(['test'], { type: 'application/pdf' });
const url = URL.createObjectURL(testBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'TEST.pdf';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

Bu TEST.pdf dosyasını indirirse, kod çalışıyor demektir.

## Tarayıcı Bilgisi:
- Hangi tarayıcı kullanıyorsunuz? (Chrome, Firefox, Edge, Safari)
- Tarayıcı versiyonu?
- İndirilen dosyanın tam adı ne? (uzantısız mı geliyor?)
