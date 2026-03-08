# Nigiri

<div align="left">
	 <img src="https://img.shields.io/badge/Bitcoin-Regtest-F7931A?style=for-the-badge&logo=bitcoin" alt="Bitcoin" />
	 <img src="https://img.shields.io/badge/Liquid-Sidechain-00AEEF?style=for-the-badge" alt="Liquid" />
	 <img src="https://img.shields.io/badge/Electrs-RPC%2FREST-1F2937?style=for-the-badge" alt="Electrs" />
	 <img src="https://img.shields.io/badge/Esplora-Block%20Explorer-111827?style=for-the-badge" alt="Esplora" />
	 <img src="https://img.shields.io/badge/Docker-Required-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
	 <img src="https://img.shields.io/badge/CLI-Nigiri-059669?style=for-the-badge" alt="CLI" />
</div>

<p align="center">
    <i>Nigiri provisions a local Bitcoin regtest stack with optional Liquid services and explorer tooling for API and integration testing. / Nigiri aprovisiona un entorno local de Bitcoin regtest con servicios opcionales de Liquid y herramientas de exploración para pruebas de API e integración.</i>
</p>

## Network Services

Nigiri groups local blockchain services into a single test environment. The stack centers on Bitcoin regtest and can be expanded with Liquid and explorer components. This lets you validate RPC behavior, transaction flow, and indexing endpoints without external infrastructure.
Nigiri agrupa servicios blockchain locales en un único entorno de pruebas. El stack se centra en Bitcoin regtest y puede ampliarse con Liquid y componentes de explorador. Esto permite validar comportamiento RPC, flujo de transacciones y endpoints de indexación sin infraestructura externa.

| Service     | Scope / Alcance                             | Interface / Interfaz        | Primary Use / Uso principal                                                           |
| ----------- | ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| **Bitcoin** | Base chain / Cadena base                    | `nigiri rpc`, `bitcoin-cli` | Wallet, UTXO, mempool, and block testing / Pruebas de wallet, UTXO, mempool y bloques |
| **Liquid**  | Sidechain (optional) / Sidechain (opcional) | `nigiri start --liquid`     | Sidechain feature validation / Validación de funcionalidades sidechain                |
| **Electrs** | Indexer / Indexador                         | RPC and REST endpoints      | Address and transaction indexing / Indexación de direcciones y transacciones          |
| **Esplora** | Explorer / Explorador                       | Web + API                   | Block and transaction inspection / Inspección de bloques y transacciones              |
| **Faucet**  | Test funding / Fondeo de prueba             | `nigiri faucet <address>`   | Automated UTXO provisioning / Aprovisionamiento automático de UTXOs                   |

## CLI Operations

The core operational interface is the `nigiri` CLI. It controls lifecycle actions, provides direct RPC forwarding, and exposes logs for troubleshooting. These commands are sufficient to run local test cycles and inspect chain behavior.
La interfaz operativa principal es la CLI `nigiri`. Controla acciones de ciclo de vida, permite el reenvío directo de RPC y expone logs para diagnóstico. Estos comandos son suficientes para ejecutar ciclos de prueba locales e inspeccionar el comportamiento de la cadena.

| Command                                     | Purpose / Propósito                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `curl https://getnigiri.vulpem.com \| bash` | Install Nigiri / Instalar Nigiri                                                                         |
| `nigiri start`                              | Start the Bitcoin regtest stack / Iniciar el stack Bitcoin regtest                                       |
| `nigiri start --liquid`                     | Start Bitcoin and Liquid services / Iniciar servicios de Bitcoin y Liquid                                |
| `nigiri stop`                               | Stop running services / Detener servicios activos                                                        |
| `nigiri stop --delete`                      | Stop and delete generated state / Detener y borrar estado generado                                       |
| `nigiri logs SERVICE --liquid`              | Stream logs for a specific service / Mostrar logs de un servicio específico                              |
| `nigiri rpc <command> <parameters>`         | Forward a Bitcoin RPC call / Reenviar una llamada RPC de Bitcoin                                         |
| `docker ps`                                 | List running containers and obtain container ID / Listar contenedores y obtener el ID                    |
| `docker exec -it <id> sh`                   | Open shell inside container to run `bitcoin-cli` / Abrir shell en contenedor para ejecutar `bitcoin-cli` |
| `bitcoin-cli <command> <parameters>`        | Execute native Bitcoin Core RPC commands / Ejecutar comandos RPC nativos de Bitcoin Core                 |
| `~/.nigiri/volumes/bitcoin/bitcoin.conf`    | Bitcoin node configuration path / Ruta de configuración del nodo Bitcoin                                 |
| `nigiri --version`                          | Print installed Nigiri version / Mostrar versión instalada de Nigiri                                     |

## Transaction and Mining Workflow

Nigiri supports both high-level and raw transaction paths for regtest scenarios. You can fund addresses with faucet calls, construct raw transactions through RPC, and control confirmation with explicit block generation. This keeps transaction state deterministic for local tests.
Nigiri soporta tanto flujos de transacción de alto nivel como transacciones RAW para escenarios regtest. Puedes fondear direcciones con faucet, construir transacciones RAW mediante RPC y controlar confirmaciones con generación explícita de bloques. Esto mantiene un estado transaccional determinista para pruebas locales.

| Stage / Etapa                                | Command Pattern / Patrón de comando                         | Output / Resultado                                                                    |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Address creation / Creación de dirección** | `nigiri rpc getnewaddress "" "bech32"`                      | New bech32 address / Nueva dirección bech32                                           |
| **Funding / Fondeo**                         | `nigiri faucet <address>`                                   | Spendable test UTXOs / UTXOs de prueba gastables                                      |
| **Raw creation / Creación RAW**              | `nigiri rpc createrawtransaction "[]" '{"<address>":0.01}'` | Unsigned raw hex / Hex RAW sin firmar                                                 |
| **Funding selection / Selección de fondos**  | `nigiri rpc fundrawtransaction "<hex>"`                     | Funded hex with selected UTXOs / Hex fondeado con UTXOs seleccionados                 |
| **Signing / Firma**                          | `nigiri rpc signrawtransactionwithwallet "<hex>"`           | Signed raw hex / Hex RAW firmado                                                      |
| **Broadcast / Difusión**                     | `nigiri rpc sendrawtransaction "<hex>"`                     | Transaction ID / ID de transacción                                                    |
| **Confirmations / Confirmaciones**           | `bitcoin-cli generatetoaddress <n> <address>`               | New blocks with confirmed transactions / Nuevos bloques con transacciones confirmadas |

## Chain Inspection and Mempool

This module requires routine inspection of address balances, transaction data, and mempool state. The following calls map directly to the exercises and support both quick validation and debugging. Use these queries after funding, broadcasting, and mining to verify expected state transitions.
Este módulo requiere inspección frecuente de saldos de direcciones, datos de transacciones y estado de mempool. Las siguientes llamadas corresponden directamente a los ejercicios y sirven tanto para validación rápida como para depuración. Usa estas consultas después de fondear, difundir y minar para verificar las transiciones de estado esperadas.

| Action / Acción                                      | Command / Comando                                               | Result / Resultado                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Address balance / Saldo por dirección**            | `nigiri rpc scantxoutset 'start' '["addr(<address>)"]'`         | UTXO-based balance for target address / Saldo por UTXOs de la dirección objetivo      |
| **Wallet balance / Saldo de wallet**                 | `bitcoin-cli getbalance` or `nigiri rpc getbalance`             | Active wallet BTC total / Total BTC de la wallet activa                               |
| **Block headers / Cabeceras de bloque**              | `nigiri rpc getblock "<blockid>"`                               | Header-level block data / Datos de cabecera de bloque                                 |
| **Block with tx / Bloque con transacciones**         | `nigiri rpc getblock "<blockid>" "2"`                           | Header plus decoded transactions / Cabecera más transacciones decodificadas           |
| **Transaction details / Detalle de transacción**     | `nigiri rpc gettransaction "<transactionid>"`                   | Wallet transaction metadata / Metadatos de transacción de wallet                      |
| **Mempool summary / Resumen de mempool**             | `nigiri rpc getmempoolinfo`                                     | Global mempool metrics / Métricas globales de mempool                                 |
| **Mempool tx list / Lista de tx en mempool**         | `nigiri rpc getrawmempool`                                      | Transaction IDs currently pending / IDs de transacciones pendientes                   |
| **Mempool tx entry / Entrada específica en mempool** | `nigiri rpc getmempoolentry <txid>`                             | Detailed mempool entry by txid / Entrada detallada por txid                           |
| **Mine specific txids / Minar txids específicos**    | `nigiri rpc generateblock "<address>" '["<txid1>", "<txid2>"]'` | Block including selected transactions / Bloque incluyendo transacciones seleccionadas |

## Electrum Connectivity

Electrum can be connected to local `electrs` in regtest mode for wallet-level validation on indexed data. The course material references Electrum 4.6.2 launched from Python sources. In Ubuntu-like systems, some GUI/runtime dependencies may need installation via `apt`.
Electrum puede conectarse al `electrs` local en modo regtest para validación a nivel de wallet sobre datos indexados. El material del curso referencia Electrum 4.6.2 ejecutado desde fuentes Python. En sistemas tipo Ubuntu, algunas dependencias de GUI/runtime pueden requerir instalación con `apt`.

| Component           | Command or Note / Comando o nota                                                                                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Electrum launch** | `python3 Electrum-4.6.2/run_electrum -1 -s 127.0.0.1:50000:t --regtest`                                                                                                                                                                                                                                                                 |
| **Dependency note** | On managed Python systems, install required packages with `apt` (for example `python3-pyqt6`) and use `pip3 --break-system-packages` only when necessary. / En entornos Python gestionados por el sistema, instala dependencias con `apt` (por ejemplo `python3-pyqt6`) y usa `pip3 --break-system-packages` solo cuando sea necesario. |

## System Architecture

| Component                  | Role / Rol                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nigiri CLI**             | Orchestrates service lifecycle and forwards RPC commands. / Orquesta el ciclo de vida de servicios y reenvía comandos RPC.                       |
| **Docker Runtime**         | Hosts isolated service containers for local execution. / Aloja contenedores aislados para ejecución local.                                       |
| **Bitcoin Node (regtest)** | Provides blockchain state, wallet functions, and mining operations. / Proporciona estado de cadena, funciones de wallet y operaciones de minado. |
| **Liquid Services**        | Adds sidechain capabilities when started with Liquid mode. / Agrega capacidades sidechain al iniciar en modo Liquid.                             |
| **Electrs**                | Indexes chain data and exposes lookup APIs. / Indexa datos de cadena y expone APIs de consulta.                                                  |
| **Esplora**                | Surfaces indexed chain data through explorer endpoints. / Expone datos indexados mediante endpoints de explorador.                               |
| **Faucet Automation**      | Mints and sends test coins to target addresses. / Emite y envía monedas de prueba a direcciones objetivo.                                        |

## Technology Stack

- **Backend/API**: Nigiri CLI, Bitcoin Core RPC via `nigiri rpc` and `bitcoin-cli` / CLI Nigiri y RPC de Bitcoin Core
- **Blockchain**: Bitcoin regtest, Liquid sidechain (optional) / Bitcoin regtest y sidechain Liquid (opcional)
- **Storage**: Docker volumes, including `~/.nigiri/volumes/bitcoin/bitcoin.conf` / Volúmenes Docker
- **Testing**: RPC-driven integration checks, deterministic local mining / Pruebas de integración por RPC y minado determinista
- **Deployment**: Local Docker host on Linux or WSL environments / Host Docker local en Linux o WSL

## Key Features

1. **Single-command local chain startup / Inicio local con un comando** — Boots a Bitcoin regtest environment with `nigiri start` for immediate local testing. / Inicia un entorno Bitcoin regtest con `nigiri start` para pruebas locales inmediatas.
2. **Optional Liquid mode / Modo Liquid opcional** — Extends the stack with sidechain services through `nigiri start --liquid`. / Extiende el stack con servicios sidechain usando `nigiri start --liquid`.
3. **Direct RPC execution / Ejecución RPC directa** — Enables scripted blockchain actions via `nigiri rpc <command> <parameters>`. / Permite acciones blockchain por script vía `nigiri rpc <command> <parameters>`.
4. **Built-in faucet flow / Flujo faucet integrado** — Funds test addresses quickly with `nigiri faucet <address>` for repeatable test runs. / Fondea direcciones de prueba rápidamente con `nigiri faucet <address>` para ejecuciones repetibles.
5. **Explorer and indexer visibility / Visibilidad de explorador e indexador** — Combines Electrs and Esplora to inspect mempool, blocks, and transactions. / Combina Electrs y Esplora para inspeccionar mempool, bloques y transacciones.
6. **Deterministic confirmations / Confirmaciones deterministas** — Controls confirmation timing using explicit block generation in regtest. / Controla los tiempos de confirmación usando generación explícita de bloques en regtest.

## Testing Strategy

Testing is centered on local integration scenarios executed through CLI and RPC calls, generally run with elevated permissions where required (`sudo` in Linux setups). Typical validation cycles include address creation, faucet funding, raw transaction broadcast, mempool inspection, and manual block generation for confirmation checks. Chain and transaction state is verified with `getblock`, `gettransaction`, and `getrawmempool`, while wallet state is cross-checked with both `bitcoin-cli getbalance` and `nigiri rpc getbalance`. If using the course virtual machine, Nigiri is already installed and test execution can start immediately.
Las pruebas se centran en escenarios de integración local ejecutados con CLI y llamadas RPC, normalmente con permisos elevados cuando sea necesario (`sudo` en entornos Linux). Los ciclos típicos de validación incluyen creación de direcciones, fondeo con faucet, difusión de transacciones RAW, inspección de mempool y generación manual de bloques para verificar confirmaciones. El estado de cadena se valida con `getblock`, `gettransaction` y `getrawmempool`, y el estado de wallet se contrasta con `bitcoin-cli getbalance` y `nigiri rpc getbalance`. Si usas la máquina virtual del curso, Nigiri ya está instalado y se puede empezar directamente.

## Project Setup

1. Install dependencies:

   Instala dependencias:

   ```bash
   curl https://getnigiri.vulpem.com | bash
   ```

   If the course virtual machine is used, skip installation because Nigiri is preinstalled.
   Si usas la máquina virtual del curso, omite la instalación porque Nigiri ya viene instalado.

2. Create `.env.local`:

   Crea `.env.local`:

   ```env
   # Nigiri runtime
   NIGIRI_HOME=~/.nigiri
   NETWORK=regtest

   # Optional service endpoints
   ELECTRUM_SERVER=127.0.0.1:50000:t
   ```

3. Start the development stack:

   Inicia el stack de desarrollo:

   ```bash
   nigiri start
   ```

4. Optional: start with Liquid services:

   Opcional: inicia con servicios Liquid:

   ```bash
   nigiri start --liquid
   ```

---

Built for Bitcoin and Liquid local development workflows. / Construido para flujos de desarrollo local con Bitcoin y Liquid.
