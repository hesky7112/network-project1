#!/usr/bin/env python3
"""
AlienModule CLI Tool
Package, install, and manage modules from the command line
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Optional

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from packaging.manifest import ModuleManifest, create_example_manifest
from packaging.packager import ModulePackager
from packaging.loader import ModuleLoader
from packaging.wasm_bundler import WASMBundler


def cmd_init(args):
    """Initialize a new module with example manifest"""
    output_dir = Path(args.directory)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create example manifest
    manifest = create_example_manifest()
    
    if args.id:
        manifest.id = args.id
    if args.name:
        manifest.name = args.name
    
    # Write manifest
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest.model_dump(), f, indent=2, default=str)
    
    # Create placeholder files
    (output_dir / "assets").mkdir(exist_ok=True)
    (output_dir / "config.yaml").write_text("# Module configuration\n")
    (output_dir / "ui.marimo").write_text(f'''# Marimo UI for {manifest.name}
import marimo as mo

# Create UI components
file_input = mo.ui.file_upload(label="Upload File")
submit = mo.ui.button(label="Process")

# Display
mo.vstack([file_input, submit])
''')
    
    print(f"✅ Module initialized at {output_dir}")
    print(f"   - manifest.json created")
    print(f"   - Edit manifest.json to customize your module")
    return 0


def cmd_package(args):
    """Package a module into .alienmodule"""
    packager = ModulePackager(args.key)
    
    try:
        result = packager.package(
            source_dir=args.source,
            output_path=args.output,
            encrypt=not args.no_encrypt,
        )
        
        if result["success"]:
            print(f"✅ Package created: {result['path']}")
            print(f"   Module: {result['module_id']} v{result['version']}")
            print(f"   Size: {result['size_bytes'] / 1024:.1f} KB")
            print(f"   Hash: {result['hash'][:16]}...")
            print(f"   Encrypted: {result['encrypted']}")
            return 0
        else:
            print(f"❌ Packaging failed: {result.get('error')}")
            return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


def cmd_install(args):
    """Install a module from .alienmodule package"""
    loader = ModuleLoader(args.modules_dir, args.key)
    
    try:
        result = loader.install(args.package, force=args.force)
        
        if result["success"]:
            print(f"✅ Installed: {result['module_id']} v{result['version']}")
            print(f"   Location: {result['install_path']}")
            return 0
        else:
            print(f"❌ Installation failed: {result.get('error')}")
            return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


def cmd_uninstall(args):
    """Uninstall a module"""
    loader = ModuleLoader(args.modules_dir)
    
    result = loader.uninstall(args.module_id)
    if result["success"]:
        print(f"✅ Uninstalled: {args.module_id}")
        return 0
    else:
        print(f"❌ Failed: {result.get('error')}")
        return 1


def cmd_list(args):
    """List installed modules"""
    loader = ModuleLoader(args.modules_dir)
    modules = loader.list_installed()
    
    if not modules:
        print("No modules installed.")
        return 0
    
    print(f"\n{'ID':<30} {'Name':<30} {'Version':<10} {'Mode':<10}")
    print("-" * 80)
    
    for m in modules:
        print(f"{m['id']:<30} {m['name']:<30} {m['version']:<10} {m['execution_mode']:<10}")
    
    print(f"\nTotal: {len(modules)} module(s)")
    return 0


def cmd_validate(args):
    """Validate a module or package"""
    path = Path(args.path)
    
    if path.suffix == ".alienmodule":
        # Validate package
        packager = ModulePackager()
        result = packager.validate(str(path))
        
        if result["valid"]:
            print(f"✅ Valid package: {path.name}")
            print(f"   Version: {result['version']}")
            print(f"   Encrypted: {result['encrypted']}")
            print(f"   Size: {result['size_bytes'] / 1024:.1f} KB")
            return 0
        else:
            print(f"❌ Invalid package: {result['error']}")
            return 1
    else:
        # Validate manifest
        manifest_path = path / "manifest.json" if path.is_dir() else path
        
        try:
            with open(manifest_path) as f:
                data = json.load(f)
            
            manifest = ModuleManifest(**data)
            print(f"✅ Valid manifest: {manifest.id}")
            print(f"   Name: {manifest.name}")
            print(f"   Version: {manifest.version}")
            print(f"   Category: {manifest.category}")
            print(f"   Primitives: {len(manifest.primitives)}")
            return 0
        except Exception as e:
            print(f"❌ Invalid manifest: {e}")
            return 1


def cmd_bundle_wasm(args):
    """Create WASM bundle for browser execution"""
    bundler = WASMBundler()
    
    try:
        result = bundler.bundle(args.source, args.output)
        
        if result["success"]:
            print(f"✅ WASM bundle created: {result['output_path']}")
            print(f"   Module: {result['module_id']}")
            print(f"   Required packages: {', '.join(result['required_packages'])}")
            return 0
        else:
            print(f"❌ Bundling failed: {result.get('error')}")
            return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


def cmd_info(args):
    """Show module information"""
    loader = ModuleLoader(args.modules_dir)
    manifest = loader.load(args.module_id)
    
    if not manifest:
        print(f"❌ Module not found: {args.module_id}")
        return 1
    
    print(f"\n{'='*60}")
    print(f" {manifest.name}")
    print(f"{'='*60}")
    print(f"\nID:          {manifest.id}")
    print(f"Version:     {manifest.version}")
    print(f"Category:    {manifest.category.value}")
    print(f"Execution:   {manifest.execution_mode.value}")
    print(f"Tags:        {', '.join(manifest.tags)}")
    print(f"\nDescription:")
    print(f"  {manifest.description}")
    
    print(f"\nPrimitives Chain:")
    for i, p in enumerate(manifest.primitives, 1):
        print(f"  {i}. {p.module}.{p.method}")
    
    print(f"\nPricing:")
    print(f"  Type:     {manifest.pricing.license_type.value}")
    print(f"  Price:    {manifest.pricing.currency} {manifest.pricing.price:,.0f}")
    
    print(f"\nRequirements:")
    print(f"  HAL:      {'Yes' if manifest.requirements.requires_hal else 'No'}")
    print(f"  GPU:      {'Yes' if manifest.requirements.requires_gpu else 'No'}")
    print(f"  WASM:     {'Yes' if manifest.requirements.wasm_compatible else 'No'}")
    
    print(f"\nAuthor:")
    print(f"  {manifest.author.name}")
    if manifest.author.organization:
        print(f"  {manifest.author.organization}")
    
    # Check requirements
    print(f"\nRequirements Check:")
    check = loader.check_requirements(args.module_id)
    if check["requirements_met"]:
        print("  ✅ All requirements met")
    else:
        for issue in check["issues"]:
            print(f"  ❌ {issue}")
    
    return 0


def main():
    parser = argparse.ArgumentParser(
        prog="alienmodule",
        description="AlienModule CLI - Package and manage modules",
    )
    parser.add_argument(
        "--modules-dir",
        default=os.getenv("MODULES_INSTALL_DIR", "./installed_modules"),
        help="Directory for installed modules",
    )
    parser.add_argument(
        "--key",
        default=os.getenv("MODULE_ENCRYPTION_KEY"),
        help="Encryption key for packages",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # init
    p_init = subparsers.add_parser("init", help="Initialize new module")
    p_init.add_argument("directory", help="Directory to initialize")
    p_init.add_argument("--id", help="Module ID")
    p_init.add_argument("--name", help="Module name")
    p_init.set_defaults(func=cmd_init)
    
    # package
    p_package = subparsers.add_parser("package", help="Create .alienmodule package")
    p_package.add_argument("source", help="Source module directory")
    p_package.add_argument("-o", "--output", help="Output path")
    p_package.add_argument("--no-encrypt", action="store_true", help="Skip encryption")
    p_package.set_defaults(func=cmd_package)
    
    # install
    p_install = subparsers.add_parser("install", help="Install module package")
    p_install.add_argument("package", help="Package file (.alienmodule)")
    p_install.add_argument("-f", "--force", action="store_true", help="Force overwrite")
    p_install.set_defaults(func=cmd_install)
    
    # uninstall
    p_uninstall = subparsers.add_parser("uninstall", help="Uninstall module")
    p_uninstall.add_argument("module_id", help="Module ID to uninstall")
    p_uninstall.set_defaults(func=cmd_uninstall)
    
    # list
    p_list = subparsers.add_parser("list", help="List installed modules")
    p_list.set_defaults(func=cmd_list)
    
    # validate
    p_validate = subparsers.add_parser("validate", help="Validate module or package")
    p_validate.add_argument("path", help="Module directory or package file")
    p_validate.set_defaults(func=cmd_validate)
    
    # bundle
    p_bundle = subparsers.add_parser("bundle", help="Create WASM bundle")
    p_bundle.add_argument("source", help="Source module directory")
    p_bundle.add_argument("-o", "--output", help="Output directory")
    p_bundle.set_defaults(func=cmd_bundle_wasm)
    
    # info
    p_info = subparsers.add_parser("info", help="Show module information")
    p_info.add_argument("module_id", help="Module ID")
    p_info.set_defaults(func=cmd_info)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
