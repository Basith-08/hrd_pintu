import type { EmployeeDocumentTemplateData } from "./employeeDocumentTemplateDownload.shared"
import { buildFieldTable, buildPage, buildPdfPreviewHtml, formatDownloadDate, printValue } from "./employeeDocumentTemplateDownload.shared"

export function buildEmailUsagePolicyHtml(data: EmployeeDocumentTemplateData) {
  return buildPdfPreviewHtml({
    title: "Kebijakan dan Aturan Penggunaan Email Korporat",
    bodyClass: "document email-policy",
    bodyHtml: `
      ${buildPage(`
        <div class="document-title">
          <span class="document-title__main">POLICY GUIDELINES</span>
          <span class="document-title__sub document-title__sub--first">
            KEBIJAKAN, BATASAN DAN PANDUAN
          </span>
          <span class="document-title__sub">PENGGUNAAN EMAIL KORPORAT DI LINGKUP MTN GROUP</span>
        </div>

        <p>
          Penggunaan email korporat sangat penting di dalam sebuah perusahaan terutama dalam
          mendukung efektifitas dan efisiensi dalam melaksanakan pekerjaan sehari-hari. Untuk itu,
          manajemen menyiapkan email korporat untuk masing-masing karyawan.
        </p>
        <p>
          Pemberlakuan kebijakan penggunaan email korporat ditetapkan oleh manajemen agar seluruh
          karyawan dapat menggunakan email-nya masing-masing sesuai dengan peruntukannya. Kami akan
          membantu seluruh karyawan dalam memahami kebijakan dan batasan-batasan dalam menggunakan
          email korporat secara tepat.
        </p>
        <p>
          Adapun tujuan dari kebijakan ini adalah untuk pengamanan informasi perusahaan dari
          pelanggaran serta menjaga reputasi perusahaan dan aset teknologi kami.
        </p>

        <div class="section-title section-title--blue">CAKUPAN</div>
        <p>
          Perusahaan akan memberikan email korporat kepada seluruh karyawan (kecuali driver, office
          boy dan messenger) dan akan diberikan per-individu dengan format
          <span class="email-link">firstname.lastname@company.co.id</span> (misalnya:
          <span class="email-link">fajar.gita@multitech.co.id</span>). Bagi karyawan yang memiliki
          nama dengan 1 suku kata akan dibuatkan dengan format
          <span class="email-link">nama@company.co.id</span> (misalnya:
          <span class="email-link">suprihatin@multitech.co.id</span>). Perusahaan juga akan
          membuatkan group email per-departemen/bagian/unit, misalnya
          <span class="email-link">hrd@multitech.co.id</span> atau
          <span class="email-link">finance@multitech.co.id</span>.
        </p>
        <p>
          Karyawan menggunakan email korporat untuk tujuan yang berhubungan dengan pekerjaan kantor
          secara umum (tidak bersifat confidential/rahasia).
        </p>

        <div class="section-title section-title--blue">ELEMEN KEBIJAKAN</div>
        <ul class="policy-bullets policy-bullets--elements">
          <li>Karyawan merepresentasikan perusahaan kapanpun email korporat digunakan.</li>
          <li>
            <strong>Email korporat adalah milik perusahaan, untuk itu:</strong>
            <ol type="a" class="policy-subpoints">
              <li>
                Manajemen memiliki wewenang penuh untuk memonitor lalu lintas dan mendokumentasikan
                seluruh komunikasi yang dilakukan dengan menggunakan email korporat.
              </li>
              <li>
                Untuk memastikan keamanan dan kerahasiaan dokumen dan informasi perusahaan, bagi
                karyawan yang ingin mengakses email korporat melalui handphone dan apabila terjadi
                kehilangan handphone, <strong>WAJIB</strong> melaporkan kepada tim IT untuk
                dilakukan tindakan penghapusan email.
              </li>
              <li>
                Seluruh karyawan <strong>WAJIB</strong> mengembalikan email korporat kepada
                perusahaan berikut seluruh konten di dalamnya pada saat pengunduran diri.
              </li>
            </ol>
          </li>
        </ul>
      `)}

      ${buildPage(`
        <div class="section-title section-title--blue">BATASAN DAN PANDUAN</div>
        <p>Berikut batasan dan panduan penggunaan email korporat:</p>
        <p class="subsection-title subsection-title--danger">Tidak Diperbolehkan:</p>
        <ul class="policy-bullets">
          <li>
            Mendaftarkan email korporat pada situs web dan layanan ilegal, tidak dapat dipercaya,
            serta situs yang mengandung konten yang melanggar nilai-nilai kepatutan dan norma yang
            berlaku.
          </li>
          <li>
            Menggunakan email korporat dengan tujuan untuk mendapatkan keuntungan pribadi dan/atau
            di luar kepentingan manajemen.
          </li>
          <li>
            Mendaftarkan email korporat pada situs web perusahaan pesaing kecuali dengan tujuan
            tertentu atau dengan persetujuan manajemen.
          </li>
          <li>
            Mengirimkan pesan yang bersifat intimidatif dan diskriminatif seperti pelecehan, ejekan
            dan hinaan.
          </li>
          <li>Menggunakan email korporat karyawan lain.</li>
          <li>Menggunakan email korporat untuk hal-hal di luar keperluan pekerjaan.</li>
        </ul>

        <p class="subsection-title subsection-title--danger">Diperbolehkan:</p>
        <p>
          Karyawan diijinkan untuk menggunakan email korporat untuk tujuan yang berkaitan dengan
          pekerjaan tanpa batasan. Misalnya untuk:
        </p>
        <ul class="policy-bullets">
          <li>
            Berkomunikasi dengan rekan kerja di internal dan eksternal selama mengikuti aturan
            panduan klasifikasi informasi/data/dokumen yang diberlakukan bagi seluruh karyawan.
          </li>
          <li>
            Memberikan alamat email korporat kepada pihak lain untuk tujuan pekerjaan yang terkait
            dengan kepentingan perusahaan.
          </li>
          <li>
            Mendaftar pada situs web yang terpercaya untuk keperluan terkait dengan pekerjaan serta
            untuk mendukung perkembangan karyawan secara professional, misalnya mendaftar untuk
            kelas atau pertemuan yang berkaitan dengan pekerjaan.
          </li>
        </ul>

        <div class="section-title section-title--danger">KEAMANAN EMAIL:</div>
        <p>
          Email sering menjadi sasaran serangan hacker, pelanggaran kerahasiaan, virus dan malware
          lainnya. Hal tersebut dapat membahayakan reputasi, legalitas dan keamanan dokumen, data
          dan peralatan teknologi perusahaan.
        </p>
        <p>Untuk menjaga dari hal-hal tersebut :</p>
        <p class="subsection-title">Pemilihan Password:</p>
        <ul class="policy-bullets">
          <li>
            Pilih kata sandi yang kuat dengan setidaknya delapan karakter (huruf kapital dan huruf
            kecil, simbol dan angka) tanpa menggunakan informasi pribadi.
          </li>
          <li>Ingat kata sandi dan bukan menuliskannya dan merahasiakannya.</li>
          <li>Ubah kata sandi email setiap tiga bulan sekali.</li>
        </ul>

        <p class="subsection-title">Hal lain yang harus diperhatikan:</p>
        <ul class="policy-bullets">
          <li>
            Waspada terhadap email spam dan virus, terutama email dengan subject yang tidak
            jelas/mencurigakan.
          </li>
          <li>Periksa kembali alamat email dan nama pengirim yang tidak dikenal untuk memastikan keamanan.</li>
          <li>
            Apabila tidak yakin dengan email yang diterima, <strong>JANGAN DIBUKA.</strong>
            Informasikan hal ini kepada tim IT perusahaan untuk memastikan keamanan.
          </li>
          <li>
            Apabila karyawan terpaksa harus mengakses email korporat di komputer publik, karyawan
            wajib memastikan password tidak tersimpan secara otomatis dan wajib memastikan log-out
            sesudah menggunakan email.
          </li>
        </ul>

        <div class="section-title section-title--blue">
          KLASIFIKASI LINGKUP PENYEBARAN INFORMASI/DATA/DOKUMEN:
        </div>
        <ul class="policy-bullets">
          <li>
            <strong>PUBLIK:</strong> Adalah informasi yang sangat umum, yang diperbolehkan untuk
            dibagikan secara bebas kepada pihak luar/masyarakat umum.
          </li>
          <li>
            <strong>INTERNAL:</strong> Adalah informasi/data/dokumen yang diperbolehkan beredar
            hanya di lingkup internal perusahaan.
          </li>
          <li>
            <strong>RAHASIA/CONFIDENTIAL:</strong> Adalah informasi/data/dokumen yang bersifat
            rahasia atau hanya dapat diakses oleh karyawan yang berwenang.
          </li>
        </ul>

        <div class="section-title">PENTING</div>
        <p>
          Untuk memastikan keamanan data dan informasi perusahaan, karyawan <strong>WAJIB</strong>
          mematuhi kebijakan, batasan dan panduan yang ditetapkan oleh perusahaan.
        </p>

        <div class="section-title section-title--danger">TINDAKAN DISIPLINER</div>
        <p>
          Karyawan yang tidak mematuhi kebijakan dan aturan yang telah ditetapkan perusahaan akan
          menghadapi tindakan disipliner hingga dan termasuk pemutusan hubungan kerja.
        </p>

        <div class="acknowledgement">
          <p>
            Dengan ini, saya menyatakan telah memahami aturan, batasan, tata tertib dan kebijakan
            yang diberlakukan untuk penggunaan email korporat sebagaimana yang diberlakukan oleh
            Perusahaan.
          </p>

          ${buildFieldTable(
            [
              { label: "No Karyawan", value: data.employeeCode },
              { label: "Nama Karyawan", value: data.employeeName },
              { label: "Jabatan", value: data.mainPosition },
              { label: "Perusahaan", value: data.companyName },
            ],
            {
              containerWidth: 420,
              labelWidth: 136,
              valueWidth: 260,
              marginLeft: 0,
              rowHeight: 24,
              fontSize: "11pt",
              underlined: true,
            },
          )}

          <div class="signature-block">
            <div class="signature-date">Jakarta, ${formatDownloadDate(new Date())}</div>
            <div class="signature-name">${printValue(data.employeeName)}</div>
            <div class="signature-line"></div>
          </div>
        </div>
      `)}
    `,
  })
}
