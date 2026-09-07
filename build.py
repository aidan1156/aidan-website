'''
Build the project by running `npm run build` and modifying the CSS and HTML files to 
let us serve data from www.doc.ic.ac.uk/~ab2923/ not a root of a site
'''
import os
import subprocess
def build():
    project_root = os.path.dirname(os.path.abspath(__file__))
    main_css_path = project_root / 'src' / 'main.css'
    dist_index_path = project_root / 'dist' / 'index.html'

    f = open(main_css_path, 'r')
    contents = f.read()
    og_css = contents
    contents = contents.replace('./font.ttf', '../font.ttf')
    f.close()

    f = open(main_css_path, 'w')
    f.write(contents)
    f.close()

    # run `npm run build` to build the project
    npm_executable = 'npm.cmd' if os.name == 'nt' else 'npm'
    subprocess.run([npm_executable, 'run', 'build'], check=True, cwd=project_root)

    f = open(main_css_path, 'w')
    f.write(og_css)
    f.close()

    f = open(dist_index_path, 'r')
    contents = f.read()
    contents = contents.replace('/assets/index', './assets/index')
    f.close()

    f = open(dist_index_path, 'w')
    f.write(contents)
    f.close()





build()