import argparse
import retro

def import_roms(rom_path):
    retro.data.Integrations.add_custom_path(rom_path)
    roms = retro.data.list_games(inttype=retro.data.Integrations.ALL)
    print(f"Imported ROMs: {roms}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rom_path", type=str, required=True)
    args = parser.parse_args()

    import_roms(args.rom_path)