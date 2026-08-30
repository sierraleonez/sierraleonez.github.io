# 🕵️ Undercover

Clone game party **Undercover** — pure vanilla HTML/CSS/JS, tanpa build step.
Pass & play di satu HP.

## Cara main

1. Atur jumlah pemain, nama, jumlah **Undercover** dan **Mr. White**.
2. Setiap pemain tap kartu untuk lihat kata rahasianya (Mr. White tidak dapat kata).
3. Bergiliran menyebut satu petunjuk tentang kata masing-masing.
4. Voting untuk mengeliminasi satu pemain, peran langsung terbuka.
5. Kalau Mr. White tereliminasi, dia dapat satu kesempatan menebak kata warga.

**Kondisi menang**
- Warga menang kalau semua undercover & Mr. White tersingkir.
- Undercover menang kalau jumlah penyusup ≥ jumlah warga yang tersisa.
- Mr. White menang instan kalau tebakannya benar.

## Kustomisasi kata

Semua kata rahasia dibaca dari [`words.json`](words.json):

```json
{
  "packs": [
    {
      "name": "Umum",
      "pairs": [
        { "civilian": "Kopi", "undercover": "Teh" }
      ]
    }
  ]
}
```

- `civilian` = kata untuk warga, `undercover` = kata untuk undercover.
- Tambah pack baru cukup dengan menambah objek di array `packs`.
- Bentuk singkat juga didukung: file berisi array `[{ "civilian": "...", "undercover": "..." }]`.
- Di dalam game ada juga menu **Tambah kata sendiri** (tersimpan di `localStorage` browser, tidak ikut ke repo).

## Menjalankan lokal

Butuh HTTP server karena `words.json` dimuat via `fetch`:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

Deploy otomatis ke GitHub Pages lewat `.github/workflows/deploy.yml` setiap push ke `main`.
